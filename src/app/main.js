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

if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body)
    run();
else
    window.addEventListener('DOMContentLoaded', run, false);

function run() {
    const webGL = new WebGL(true);
    const VIEW_DISTANCE = 17;
    const TEX_DATA_WIDTH = 512;

    const vertexIndexTracker = new Float32Array(TEX_DATA_WIDTH*TEX_DATA_WIDTH);
    for (let n=0;n<TEX_DATA_WIDTH*TEX_DATA_WIDTH;n++)
        vertexIndexTracker[n] = n/1024;

    const vertexData = new Uint8Array(TEX_DATA_WIDTH*TEX_DATA_WIDTH);

    webGL.createTexture('grass', 'textures/grass.png');
    webGL.createTexture('grassEdge', 'textures/grassEdge.png');
    webGL.createTexture('dirt', 'textures/dirt.png');
    webGL.createTexture('stone', 'textures/stone.png');

    const fog_sky_color = [0.3, 0.65, 1.0];
    const fog_underground_color = [0.0, 0.0, 0.0];
    const eyeDistance = 0.6;

    webGL.createShader('tile', TileVert, TileFrag, [
            {name: 'a_index', size: 4, count: 1, type: 'FLOAT'}
        ],
        [
            {name: 'u_texDataWidth', type: '1f', value: TEX_DATA_WIDTH},
/*            {name: 'u_sky_light', type: '3fv', value: [1.0, 1.0, 1.0]},
            {name: 'u_view_distance', type: '1f', value: VIEW_DISTANCE},
            {name: 'u_height', type: '1f', value: null},*/
            {name: 'u_camera', type: '3fv', value: null}/*,
            {name: 'u_camera_face', type: '3fv', value: null},
            {name: 'u_self_light', type: '3fv', value: [1.0, 1.0, 1.0]},
            {name: 'u_sun_light_face', type: '3fv', value: [-0.3, -0.5, -0.2]},
            {name: 'u_fog_sky_color', type: '3fv', value: fog_sky_color},
            {name: 'u_fog_underground_color', type: '3fv', value: fog_underground_color},
            {name: 'u_sun_light_color', type: '3fv', value: [1.0, 1.0, 1.0]}*/,
            {
                name: 'u_normuv', type: '1fv', value: [
                // x-
                0, 0, 0, -1, 0, 0, 0, 0,
                0, 0, 1, -1, 0, 0, 1, 0,
                0, 1, 0, -1, 0, 0, 0, 1,
                0, 1, 0, -1, 0, 0, 0, 1,
                0, 0, 1, -1, 0, 0, 1, 0,
                0, 1, 1, -1, 0, 0, 1, 1,
                // y-
                0, 0, 0, 0, -1, 0, 0, 0,
                1, 0, 0, 0, -1, 0, 1, 0,
                0, 0, 1, 0, -1, 0, 0, 1,
                0, 0, 1, 0, -1, 0, 0, 1,
                1, 0, 0, 0, -1, 0, 1, 0,
                1, 0, 1, 0, -1, 0, 1, 1,
                // z-
                1, 0, 0, 0, 0, -1, 0, 0,
                0, 0, 0, 0, 0, -1, 1, 0,
                1, 1, 0, 0, 0, -1, 0, 1,
                1, 1, 0, 0, 0, -1, 0, 1,
                0, 0, 0, 0, 0, -1, 1, 0,
                0, 1, 0, 0, 0, -1, 1, 1,
                // x+
                1, 0, 1, 1, 0, 0, 0, 0,
                1, 0, 0, 1, 0, 0, 1, 0,
                1, 1, 1, 1, 0, 0, 0, 1,
                1, 1, 1, 1, 0, 0, 0, 1,
                1, 0, 0, 1, 0, 0, 1, 0,
                1, 1, 0, 1, 0, 0, 1, 1,
                // y+
                1, 1, 0, 0, 1, 0, 0, 0,
                0, 1, 0, 0, 1, 0, 1, 0,
                1, 1, 1, 0, 1, 0, 0, 1,
                1, 1, 1, 0, 1, 0, 0, 1,
                0, 1, 0, 0, 1, 0, 1, 0,
                0, 1, 1, 0, 1, 0, 1, 1,
                // z+
                0, 0, 1, 0, 0, 1, 0, 0,
                1, 0, 1, 0, 0, 1, 1, 0,
                0, 1, 1, 0, 0, 1, 0, 1,
                0, 1, 1, 0, 0, 1, 0, 1,
                1, 0, 1, 0, 0, 1, 1, 0,
                1, 1, 1, 0, 0, 1, 1, 1
            ]
        }
    ]);

    var lastTime = (new Date()).getTime();

    const mapSize = 64;
    const camera = glm.vec3.fromValues(mapSize / 2, mapSize - 5, mapSize / 2);

    const cameraFace = glm.vec3.fromValues(0, 0, -1);
    const cameraUp = glm.vec3.fromValues(0, 1, 0);
    const cameraForward = glm.vec3.create();
    const cameraRight = glm.vec3.create();

    const orient = new Orientation();

    let faces;
let loops = 0;
    let GL = webGL._private.gl;
let cnt;
    function render() {
        var newTime = (new Date()).getTime();
        var delta = (newTime - lastTime) / 1000;
        lastTime = newTime;
loops++;
        step(delta);

        const depthRatio = Math.min(1, Math.max(0, (mapSize - camera[1] - 8) / 10));
        const fogColor = [
            (fog_sky_color[0] * (1 - depthRatio)) + (fog_underground_color[0] * depthRatio),
            (fog_sky_color[1] * (1 - depthRatio)) + (fog_underground_color[1] * depthRatio),
            (fog_sky_color[2] * (1 - depthRatio)) + (fog_underground_color[2] * depthRatio)
        ];

        cnt = map.getForRender(camera, cameraFace, VIEW_DISTANCE + 5,vertexData,vertexIndexTracker);

        GL.bindTexture(GL.TEXTURE_2D,tex);
        GL.texImage2D(GL.TEXTURE_2D,0,GL.LUMINANCE,TEX_DATA_WIDTH,TEX_DATA_WIDTH,0,GL.LUMINANCE,GL.UNSIGNED_BYTE, vertexData);
        GL.texParameteri(GL.TEXTURE_2D,GL.TEXTURE_MAG_FILTER,GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D,GL.TEXTURE_MIN_FILTER,GL.NEAREST);
        GL.bindTexture(GL.TEXTURE_2D,null);

        for (let e = 0; e < 2; e++) {
            let myShader = webGL._private.shaders['tile'];
            GL.useProgram(myShader.shader);

            let cvec = glm.vec3.create();
            glm.vec3.scale(cvec, cameraRight, (e - 0.5) * eyeDistance);
            glm.vec3.add(cvec, cvec, camera);
            webGL.renderStart(cvec, cameraFace, cameraUp, fogColor, e + 1);
    GL.activeTexture(GL['TEXTURE31']);
    GL.bindTexture(GL.TEXTURE_2D, tex);
    GL.uniform1i(GL.getUniformLocation(myShader.shader, 'tex31'), 31);
            webGL.render(myShader, 'TRIANGLES', vertexIndexTracker, cnt/5*6, 0, ['dirt'], {// cnt/5
//                u_camera_face: cameraFace,
                u_camera: camera//,
//                u_height: depthRatio
            });
        }

        requestAnimationFrame(render);
    }

    const map = new Map(mapSize);
    const gen = new MapGenerator(map);

    console.log(gen.autoGenerate());

    const input = new Input();

    let tex = GL.createTexture();

    render();
    console.log(cnt);
    console.log(Tile.getCount());
    console.log(vertexData.slice(0,30));
    //console.log('map mem: ' + Math.floor(map.getMemoryUsage() / 1000) + 'KB');
    //console.log('faces: ' + Math.floor(faces / 1000) + 'KB');
    //console.log('face mem: ' + Math.floor(faces / 1000 * 30 * 2 * 4) + 'KB');

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

        let t;
        t = glm.vec3.create();
        glm.vec3.scale(t, cameraRight, actions.moveX);
        glm.vec3.add(camera, camera, t);

        t = glm.vec3.create();
        glm.vec3.scale(t, cameraUp, actions.moveY);
        glm.vec3.add(camera, camera, t);

        t = glm.vec3.create();
        glm.vec3.scale(t, cameraForward, actions.moveZ);
        glm.vec3.add(camera, camera, t);

        glm.vec3.cross(cameraRight, cameraFace, cameraUp);
        cameraRight[1] = 0;
        glm.vec3.normalize(cameraRight, cameraRight);
        glm.vec3.cross(cameraForward, cameraRight, cameraUp);

        //storage.step(delta);
    }
}

