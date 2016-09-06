import WebGL from './WebGL.js';
import State from './../State.js';
import glm from 'gl-matrix';

import TileFrag from './shaders/tile/fragment.glsl';
import TileVert from './shaders/tile/vertex.glsl';
import GUIFrag from './shaders/gui/fragment.glsl';
import GUIVert from './shaders/gui/vertex.glsl';

export default class Renderer {
    constructor(appState){
        const p = this._private = {
            state:new State({
                VIEW_DISTANCE:30,
                TEX_DATA_WIDTH:1024,
                FOG_SKY_COLOR:[0.3, 0.65, 1.0],
                FOG_UNDERGROUND_COLOR:[0.0, 0.0, 0.0],
                EYE_DISTANCE:0.2
            }),
            webGL:new WebGL(true),
            mapSize:appState.mapSize
        };

        const webGL = p.webGL;

        const TEX_DATA_WIDTH = p.state.get('TEX_DATA_WIDTH');
        p.vertexData = webGL.createDataTexture('blocks',TEX_DATA_WIDTH);

        p.vertexIndexTracker = new Float32Array(TEX_DATA_WIDTH*TEX_DATA_WIDTH);
        for (let n=0;n<TEX_DATA_WIDTH*TEX_DATA_WIDTH;n++)
            p.vertexIndexTracker[n] = n/1024;

        webGL.createTexture('blocks', 'textures/combined.png',false); //0
        webGL.createTexture('crosshair', 'textures/crosshair.png',false); //0

        webGL.createShader('tile', TileVert, TileFrag, [
                {name: 'a_index', size: 4, count: 1, type: 'FLOAT'}
            ],
            [
                {name: 'u_texDataWidth', type: '1f', value: TEX_DATA_WIDTH},
                {name: 'u_sky_light', type: '3fv', value: [1.0, 1.0, 1.0]},
                {name: 'u_view_distance', type: '1f', value: p.state.get('VIEW_DISTANCE')},
                {name: 'u_height', type: '1f', value: null},
                {name: 'u_camera', type: '3fv', value: null},
                {name: 'u_camera_face', type: '3fv', value: null},
                {name: 'u_self_light', type: '3fv', value: [1.0, 1.0, 1.0]},
                {name: 'u_sun_light_face', type: '3fv', value: [-0.3, -0.5, -0.2]},
                {name: 'u_fog_sky_color', type: '3fv', value: p.state.get('FOG_SKY_COLOR')},
                {name: 'u_fog_underground_color', type: '3fv', value: p.state.get('FOG_UNDERGROUND_COLOR')},
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
            {name: 'u_eyeOffset', type: '1f', value: 0}
        ]);
    }

    newGame(){
        const p = this._private;

        p.state.set({
        });
    }

    render(map,camera,cameraFace,cameraUp,cameraRight,isVR=false){
        const p = this._private;
        const TEX_DATA_WIDTH = p.state.get('TEX_DATA_WIDTH');
        const FOG_SKY_COLOR = p.state.get('FOG_SKY_COLOR');
        const FOG_UNDERGROUND_COLOR = p.state.get('FOG_UNDERGROUND_COLOR');
        const EYE_DISTANCE = p.state.get('EYE_DISTANCE');
        const VIEW_DISTANCE = p.state.get('VIEW_DISTANCE');
        const GL = p.webGL._private.gl;
        const webGL = p.webGL;

        const depthRatio = Math.min(1, Math.max(0, (p.mapSize - camera[1] - 8) / 10));
        const fogColor = [
            (FOG_SKY_COLOR[0] * (1 - depthRatio)) + (FOG_UNDERGROUND_COLOR[0] * depthRatio),
            (FOG_SKY_COLOR[1] * (1 - depthRatio)) + (FOG_UNDERGROUND_COLOR[1] * depthRatio),
            (FOG_SKY_COLOR[2] * (1 - depthRatio)) + (FOG_UNDERGROUND_COLOR[2] * depthRatio)
        ];

        let cnt = map.getForRender(camera, cameraFace, VIEW_DISTANCE + 5,p.vertexData);

        webGL.updateDataTexture('blocks');

        if (isVR)
            p.webGL.startBarrelCapture();

        for (let e = 0; e < (isVR?2:1); e++) {

            let myShader = p.webGL._private.shaders['tile'];
            GL.useProgram(myShader.shader);

            let cvec = glm.vec3.create();
            glm.vec3.scale(cvec, cameraRight, (isVR?(e - 0.5):0) * EYE_DISTANCE);
            if (isVR) {
                let tvec = glm.vec3.create();
                glm.vec3.scale(tvec, cameraFace, -0.35);
                glm.vec3.add(cvec, cvec, tvec);
            }
            glm.vec3.add(cvec, cvec, camera);
            webGL.renderStart(cvec, cameraFace, cameraUp, fogColor, e + (isVR?1:0),isVR?p.webGL._private.rttFramebuffer:null);

            webGL.attachDataTexture('blocks',myShader.shader,31);

            webGL.render(myShader, 'TRIANGLES', p.vertexIndexTracker, cnt/(6)*6, 0, ['blocks'], {
                u_camera_face: cameraFace,
                u_camera: camera,
                u_height: depthRatio
            });

            let guiVertex = new Float32Array([
                0.05, -0.05, -1.5, 1.0, 0.0,
                0.05, 0.05, -1.5, 1.0, 1.0,
                -0.05, 0.05, -1.5, 0.0, 1.0,
                -0.05, -0.05, -1.5, 0.0, 0.0
            ]);

            GL.disable(GL.DEPTH_TEST);
            p.webGL.render('gui', 'TRIANGLE_FAN', guiVertex, 4, 0, ['crosshair'],{u_eyeOffset:(isVR?(e - 0.5):0) * EYE_DISTANCE});
            GL.enable(GL.DEPTH_TEST);
        }

        if (isVR) {
            p.webGL.endBarrelCapture();
            p.webGL.renderBarrel(0);
        }
    }
};