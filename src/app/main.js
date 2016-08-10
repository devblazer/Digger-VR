require('./main.css');
import Util from './lib/Util.js';
import WebGL from './lib/render/WebGL.js';
import Input from './lib/game/Input.js';
import Orientation from './lib/game/Orientation.js';
import Map from './lib/game/Map.js';
import MapGenerator from './lib/generation/MapGenerator.js';
import Tile from './lib/render/Tile.js';
import glm from 'gl-matrix';

import TileFrag from './lib/render/shaders/tile/fragment.glsl';
import TileVert from './lib/render/shaders/tile/vertex.glsl';
import GUIFrag from './lib/render/shaders/gui/fragment.glsl';
import GUIVert from './lib/render/shaders/gui/vertex.glsl';

if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body)
    run();
else
    window.addEventListener('DOMContentLoaded', run, false);

function run() {
    const webGL = new WebGL(true);

    const VIEW_DISTANCE = 23;
    const mapSize = 32;
    const camera = glm.vec3.fromValues(mapSize / 2, mapSize - 5, mapSize / 2);

    const fog_sky_color = [0.3, 0.65, 1.0];
    const fog_underground_color = [0.0, 0.0, 0.0];
    const eyeDistance = 0.6;

    const SELF_COL_RADIUS = 0.75;
    const SELF_COL_HEIGHT = 2.5;
    const SELF_EYE_HEIGHT = 2;

    const GRAVITY = 0.5;
    const JUMP_VELOCITY = 10;
    const MAX_FALL_SPEED = 18;
    const MOVE_SPEED = 1.6;

    const DIG_RATE = 0.4;
    let lastDig = 0;
    let wasDigging = false;

    const TEX_DATA_WIDTH = 512;

    const vertexIndexTracker = new Float32Array(TEX_DATA_WIDTH*TEX_DATA_WIDTH);
    for (let n=0;n<TEX_DATA_WIDTH*TEX_DATA_WIDTH;n++)
        vertexIndexTracker[n] = n/1024;

    const vertexData = new Uint8Array(TEX_DATA_WIDTH*TEX_DATA_WIDTH);

    webGL.createTexture('blocks', 'textures/combined.png',false); //0
    webGL.createTexture('crosshair', 'textures/crosshair.png',false); //0

    webGL.createShader('tile', TileVert, TileFrag, [
            {name: 'a_index', size: 4, count: 1, type: 'FLOAT'}
        ],
        [
            {name: 'u_texDataWidth', type: '1f', value: TEX_DATA_WIDTH},
            {name: 'u_sky_light', type: '3fv', value: [1.0, 1.0, 1.0]},
            {name: 'u_view_distance', type: '1f', value: VIEW_DISTANCE},
            {name: 'u_height', type: '1f', value: null},
            {name: 'u_camera', type: '3fv', value: null},
            {name: 'u_camera_face', type: '3fv', value: null},
            {name: 'u_self_light', type: '3fv', value: [1.0, 1.0, 1.0]},
            {name: 'u_sun_light_face', type: '3fv', value: [-0.3, -0.5, -0.2]},
            {name: 'u_fog_sky_color', type: '3fv', value: fog_sky_color},
            {name: 'u_fog_underground_color', type: '3fv', value: fog_underground_color},
            {name: 'u_sun_light_color', type: '3fv', value: [1.0, 1.0, 1.0]},
            {name: 'u_cubeTextures', type: '1fv', value: [
                0, 0, 0,
                1, 2, 0,
                3, 3, 3
            ]},
            {name: 'u_cubeUV', type: '1fv', value: [
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1
            ]},
            {name: 'u_cubeNormals', type: '1fv', value: [
                -1, 0, 0,
                0, -1, 0,
                0, 0, -1,
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            ]},
            {
                name: 'u_cubePositions', type: '1fv', value: [
                // x-
                0, 0, 0,
                0, 0, 1,
                0, 1, 0,
                0, 1, 0,
                0, 0, 1,
                0, 1, 1,
                // y-
                0, 0, 0,
                1, 0, 0,
                0, 0, 1,
                0, 0, 1,
                1, 0, 0,
                1, 0, 1,
                // z-
                1, 0, 0,
                0, 0, 0,
                1, 1, 0,
                1, 1, 0,
                0, 0, 0,
                0, 1, 0,
                // x+
                1, 0, 1,
                1, 0, 0,
                1, 1, 1,
                1, 1, 1,
                1, 0, 0,
                1, 1, 0,
                // y+
                1, 1, 0,
                0, 1, 0,
                1, 1, 1,
                1, 1, 1,
                0, 1, 0,
                0, 1, 1,
                // z+
                0, 0, 1,
                1, 0, 1,
                0, 1, 1,
                0, 1, 1,
                1, 0, 1,
                1, 1, 1
            ]
        }
    ]);

    webGL.createShader('gui', GUIVert, GUIFrag, [
        {name: 'a_position', size: 4, count: 3, type: 'FLOAT'},
        {name: 'a_uv', size: 4, count: 2, type: 'FLOAT'}
    ],[
        {name: 'u_eyeOffset', type: '1f', value: 0},
    ]);

    var lastTime = (new Date()).getTime();

    const cameraFace = glm.vec3.fromValues(0, 0, -1);
    const cameraUp = glm.vec3.fromValues(0, 1, 0);
    const cameraForward = glm.vec3.create();
    const cameraRight = glm.vec3.create();

    let yVelocity = 0;
    let canJump = false;

    const orient = new Orientation();

    let GL = webGL._private.gl;

    function render() {
        var newTime = (new Date()).getTime();
        var delta = (newTime - lastTime) / 1000;
        lastTime = newTime;

        step(delta);

        const depthRatio = Math.min(1, Math.max(0, (mapSize - camera[1] - 8) / 10));
        const fogColor = [
            (fog_sky_color[0] * (1 - depthRatio)) + (fog_underground_color[0] * depthRatio),
            (fog_sky_color[1] * (1 - depthRatio)) + (fog_underground_color[1] * depthRatio),
            (fog_sky_color[2] * (1 - depthRatio)) + (fog_underground_color[2] * depthRatio)
        ];

        let cnt = map.getForRender(camera, cameraFace, VIEW_DISTANCE + 5,vertexData,vertexIndexTracker);

        GL.bindTexture(GL.TEXTURE_2D,tex);
        GL.texImage2D(GL.TEXTURE_2D,0,GL.LUMINANCE,TEX_DATA_WIDTH,TEX_DATA_WIDTH,0,GL.LUMINANCE,GL.UNSIGNED_BYTE, vertexData);
        GL.texParameteri(GL.TEXTURE_2D,GL.TEXTURE_MAG_FILTER,GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D,GL.TEXTURE_MIN_FILTER,GL.NEAREST);
        GL.bindTexture(GL.TEXTURE_2D,null);

        for (let e = 0; e < (orient.enabled?2:1); e++) {
            let myShader = webGL._private.shaders['tile'];
            GL.useProgram(myShader.shader);

            let cvec = glm.vec3.create();
            glm.vec3.scale(cvec, cameraRight, (orient.enabled?(e - 0.5):0) * eyeDistance);
            if (orient.enabled) {
                let tvec = glm.vec3.create();
                glm.vec3.scale(tvec, cameraFace, -0.35);
                glm.vec3.add(cvec, cvec, tvec);
            }
            glm.vec3.add(cvec, cvec, camera);
            webGL.renderStart(cvec, cameraFace, cameraUp, fogColor, e + (orient.enabled?1:0));
            GL.activeTexture(GL['TEXTURE31']);
            GL.bindTexture(GL.TEXTURE_2D, tex);
            GL.uniform1i(GL.getUniformLocation(myShader.shader, 'tex31'), 31);

            webGL.render(myShader, 'TRIANGLES', vertexIndexTracker, cnt/5*6, 0, ['blocks'], {
                u_camera_face: cameraFace,
                u_camera: camera,
                u_height: depthRatio
            });

            let guiVertex = [
                0.05, -0.05, -1.5, 1.0, 0.0,
                0.05, 0.05, -1.5, 1.0, 1.0,
                -0.05, 0.05, -1.5, 0.0, 1.0,
                -0.05, -0.05, -1.5, 0.0, 0.0
            ];
            guiVertex = new Float32Array(guiVertex);

            GL.disable(GL.DEPTH_TEST);
            webGL.render('gui', 'TRIANGLE_FAN', guiVertex, 4, 0, ['crosshair'],{u_eyeOffset:(orient.enabled?(e - 0.5):0) * eyeDistance});
            GL.enable(GL.DEPTH_TEST);
        }

        requestAnimationFrame(render);
    }

    const map = new Map(mapSize);
    const gen = new MapGenerator(map);

    console.log(gen.autoGenerate());

    const input = new Input(map,camera,cameraFace);

    let tex = GL.createTexture();

    render();

    function step(delta) {

        let actions = input.getAllActions(delta);

        if (actions.rotateY)
            glm.vec3.rotateY(cameraFace, cameraFace, glm.vec3.fromValues(0, 0, 0), Util.deg2Rad(-actions.rotateY) / 3);
        if (actions.rotateX) {
            if ((cameraFace[1] > -0.99 || actions.rotateX < 0) && (cameraFace[1] < 0.99 || actions.rotateX > 0)) {
                let q = glm.quat.create();
                let r = glm.vec3.create();
                glm.vec3.cross(r, cameraFace, cameraUp);
                glm.quat.setAxisAngle(q, r, -actions.rotateX / 60);
                glm.vec3.transformQuat(cameraFace, cameraFace, q);
                glm.vec3.normalize(cameraFace, cameraFace);
            }
        }

        glm.vec3.cross(cameraRight, cameraFace, cameraUp);
        cameraRight[1] = 0;
        glm.vec3.normalize(cameraRight, cameraRight);
        glm.vec3.cross(cameraForward, cameraRight, cameraUp);

        orient.update(cameraFace);

        glm.vec3.cross(cameraRight, cameraFace, cameraUp);
        cameraRight[1] = 0;
        glm.vec3.normalize(cameraRight, cameraRight);
        glm.vec3.cross(cameraForward, cameraRight, cameraUp);

        yVelocity = Math.max(-MAX_FALL_SPEED, yVelocity - GRAVITY);

        let posOld = new glm.vec3.fromValues(0,0,0);
        glm.vec3.copy(posOld,camera);
        let posNew = new glm.vec3.fromValues(0,0,0);
        glm.vec3.copy(posNew,camera);

        let t;
        t = glm.vec3.create();
        glm.vec3.scale(t, cameraRight, actions.moveX*MOVE_SPEED);
        glm.vec3.add(posNew, posNew, t);

        if (canJump && actions.moveY > 0) {
            yVelocity += JUMP_VELOCITY;
            canJump = false;
        }

        t = glm.vec3.create();
        glm.vec3.scale(t, cameraUp, yVelocity*delta);
        //glm.vec3.scale(t, cameraUp, actions.moveY);
        glm.vec3.add(posNew, posNew, t);

        t = glm.vec3.create();
        glm.vec3.scale(t, cameraForward, actions.moveZ*MOVE_SPEED);
        glm.vec3.add(posNew, posNew, t);

        var pos = {x:posNew[0],y:posNew[1],z:posNew[2]};
        var movement = {x:pos.x-posOld[0],y:yVelocity,z:pos.z-posOld[2]};

        var oldy = posOld[1];
        var oldz = posOld[2];
        // check X+
        if (movement.x>0) {
            var minorX = 1000000;
            var x = Math.floor(pos.x + SELF_COL_RADIUS);
            for (var y = Math.floor(oldy-SELF_EYE_HEIGHT); y <= Math.floor(oldy-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                if (y!=oldy-SELF_EYE_HEIGHT) {
                    for (var z = Math.floor(oldz - SELF_COL_RADIUS); z <= Math.floor(oldz + SELF_COL_RADIUS); z++) {
                        if (z!=oldz+SELF_COL_RADIUS && map.get(x, y, z)) {
                            minorX = Math.min(minorX, x);
                        }
                    }
                }
            }
            if (minorX != 1000000) {
                pos.x = minorX - SELF_COL_RADIUS;
            }
        }
        // check X-
        else if (movement.x<0) {
            var minorX = -1000000;
            var x = Math.floor(pos.x - SELF_COL_RADIUS);
            for (var y = Math.floor(oldy-SELF_EYE_HEIGHT); y <= Math.floor(oldy-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                if (y!=oldy-SELF_EYE_HEIGHT) {
                    for (var z = Math.floor(oldz - SELF_COL_RADIUS); z <= Math.floor(oldz + SELF_COL_RADIUS); z++) {
                        if (z!=oldz+SELF_COL_RADIUS&& map.get(x, y, z)) {
                            minorX = Math.max(minorX, x);
                        }
                    }
                }
            }
            if (minorX != -1000000) {
                pos.x = minorX + 1 + SELF_COL_RADIUS;
            }
        }
        // check Z+
        if (movement.z>0) {
            var minorZ = 1000000;
            var z = Math.floor(pos.z + SELF_COL_RADIUS);
            for (var y = Math.floor(oldy-SELF_EYE_HEIGHT); y <= Math.floor(oldy-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                if (y!=oldy-SELF_EYE_HEIGHT) {
                    for (var x = Math.floor(pos.x - SELF_COL_RADIUS); x <= Math.floor(pos.x + SELF_COL_RADIUS); x++) {
                        if (x!=pos.x+SELF_COL_RADIUS && map.get(x, y, z)) {
                            minorZ = Math.min(minorZ, z);
                        }
                    }
                }
            }
            if (minorZ != 1000000) {
                pos.z = minorZ - SELF_COL_RADIUS;
            }
        }
        // check Z-
        else if (movement.z<0) {
            var minorZ = -1000000;
            var z = Math.floor(pos.z - SELF_COL_RADIUS);
            for (var y = Math.floor(oldy-SELF_EYE_HEIGHT); y <= Math.floor(oldy-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                if (y!=oldy-SELF_EYE_HEIGHT) {
                    for (var x = Math.floor(pos.x - SELF_COL_RADIUS); x <= Math.floor(pos.x + SELF_COL_RADIUS); x++) {
                        if (x!=pos.x+SELF_COL_RADIUS && map.get(x, y, z)) {
                            minorZ = Math.max(minorZ, z);
                        }
                    }
                }
            }
            if (minorZ != -1000000) {
                pos.z = minorZ + 1 + SELF_COL_RADIUS;
            }
        }
        // check bottom
        if (movement.y<0) {
            var highestY = 0;
            for (var x = Math.floor(pos.x - SELF_COL_RADIUS); x <= Math.floor(pos.x + SELF_COL_RADIUS); x++) {
                if (x!=pos.x+SELF_COL_RADIUS) {
                    for (var y = Math.floor(pos.y) - SELF_EYE_HEIGHT; y <= Math.floor(pos.y) - SELF_EYE_HEIGHT+1; y++) {
                        for (var z = Math.floor(pos.z - SELF_COL_RADIUS); z <= Math.floor(pos.z + SELF_COL_RADIUS); z++) {
                            if (z!=pos.z+SELF_COL_RADIUS && map.get(x, y, z)) {
                                highestY = Math.max(highestY, y);
                            }
                        }
                    }
                }
            }
            if (highestY != 0) {
                pos.y = highestY + SELF_EYE_HEIGHT+1;
                canJump = true;
                yVelocity = 0;
            }
        }
        // check top
        else if (movement.y>0) {
            var lowestY = 1000000;
            for (var x = Math.floor(pos.x - SELF_COL_RADIUS); x <= Math.floor(pos.x + SELF_COL_RADIUS); x++) {
                if (x!=pos.x+SELF_COL_RADIUS) {
                    for (var y = Math.floor(pos.y); y <= Math.floor(pos.y-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                        for (var z = Math.floor(pos.z - SELF_COL_RADIUS); z <= Math.floor(pos.z + SELF_COL_RADIUS); z++) {
                            if (z!=pos.z+SELF_COL_RADIUS && map.get(x, y, z)) {
                                lowestY = Math.min(lowestY, y);
                            }
                        }
                    }
                }
            }
            if (lowestY != 1000000) {
                pos.y = lowestY - SELF_COL_HEIGHT + SELF_EYE_HEIGHT;
                yVelocity = movement.y/-2;
            }
        }
        // check step
        if (!yVelocity) {
            var hasBottom = false;
            var y = Math.floor(pos.y - SELF_EYE_HEIGHT + 0.00001);
            for (var x = Math.floor(pos.x - SELF_COL_RADIUS - 0.00001); x <= Math.floor(pos.x + SELF_COL_RADIUS + 0.00001); x++) {
                for (var z = Math.floor(pos.z - SELF_COL_RADIUS - 0.00001); z <= Math.floor(pos.z + SELF_COL_RADIUS + 0.00001); z++) {
                    if (map.get(x, y, z)) {
                        hasBottom = {x:x,z:z};
                    }
                }
            }
            var hasTop = false;
            for (var x = Math.floor(pos.x- SELF_COL_RADIUS - 0.00001); x <= Math.floor(pos.x + SELF_COL_RADIUS + 0.00001); x++) {
                for (var y = Math.floor(pos.y - 0.99999); y <= Math.floor(pos.y + 1.99999); y++) {
                    for (var z = Math.floor(pos.z- SELF_COL_RADIUS - 0.00001); z <= Math.floor(pos.z + SELF_COL_RADIUS + 0.00001); z++) {
                        if (map.get(x, y, z)) {
                            hasTop = true;
                        }
                    }
                }
            }
            if (hasBottom && !hasTop) {
                pos.y += 1;
                var xdiff = Math.abs(pos.x-(hasBottom.x+0.5));
                var zdiff = Math.abs(pos.z-(hasBottom.z+0.5));
                if (xdiff>zdiff) {
                    pos.x += (Math.sign((hasBottom.x + 0.5) + pos.x) / 50000);
                }
                else {
                    pos.z += (Math.sign((hasBottom.z + 0.5) + pos.z) / 50000);
                }
            }
        }

        camera[0] = pos.x;
        camera[1] = pos.y;
        camera[2] = pos.z;

        glm.vec3.cross(cameraRight, cameraFace, cameraUp);
        cameraRight[1] = 0;
        glm.vec3.normalize(cameraRight, cameraRight);
        glm.vec3.cross(cameraForward, cameraRight, cameraUp);

        camera[0] = Math.max(camera[0], SELF_COL_RADIUS);
        camera[2] = Math.max(camera[2], SELF_COL_RADIUS);
        camera[0] = Math.min(camera[0], mapSize-SELF_COL_RADIUS);
        camera[2] = Math.min(camera[2], mapSize-SELF_COL_RADIUS);

        if (actions.dig) {
            if (!wasDigging) {
                wasDigging = true;
                lastDig = Math.max(lastDig,(new Date()).getTime()-(DIG_RATE*1000));
            }
            while ((new Date()).getTime() - lastDig >= (DIG_RATE*1000)) {
                lastDig += (DIG_RATE*1000);
                let res = map.findIntersect(camera,cameraFace,4);
                if (res)
                    map.set(res[0],res[1],res[2],false);
            }
        }
        else
            wasDigging = false;

        //storage.step(delta);
    }
}

