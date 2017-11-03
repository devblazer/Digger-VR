import WebGL from './WebGL.js';
import State from './../State.js';
import SplitVertexImageBuffer from './splitVertexImageBuffer.js';

import BlockData from './../data/BlockData.js';

import TileFrag from './shaders/tile/fragment.glsl';
import TileVert from './shaders/tile/vertex.glsl';
import GUIFrag from './shaders/gui/fragment.glsl';
import GUIVert from './shaders/gui/vertex.glsl';

var glm = require('gl-matrix');

let dbg = true;
export default class Renderer {
    constructor(appState,inventory){
        const p = this._private = {
            state:new State({
                VIEW_DISTANCE:60,
                TEX_DATA_WIDTH:1024,
                FOG_SKY_COLOR:[0.3, 0.65, 1.0],
                FOG_UNDERGROUND_COLOR:[0.0, 0.0, 0.0],
                EYE_DISTANCE:0.2
            }),
            webGL:new WebGL(true),
            mapSize:appState.mapSize,
            gfx:{
                inventoryContainer: new Image()
            },
            inventory,
            mainVertexBufferKeep:true,
            barrelVertexBufferKeep:true
        };
        p.gfx.inventoryContainer.src = '/gfx/inventory_container.png';

        const webGL = p.webGL;

        const TEX_DATA_WIDTH = p.state.get('TEX_DATA_WIDTH');
        p.vertexData = new SplitVertexImageBuffer('blockVertexData',webGL,TEX_DATA_WIDTH);

        p.vertexIndexTracker = new Float32Array(TEX_DATA_WIDTH*TEX_DATA_WIDTH);
        for (let n=0;n<TEX_DATA_WIDTH*TEX_DATA_WIDTH;n++)
            p.vertexIndexTracker[n] = n/1024;

        webGL.createTexture('blocks', 'textures/combined.png',false); //0
        webGL.createTexture('crosshair', 'textures/crosshair.png',false); //0
        webGL.createTexture('inventory_container', 'textures/inventory_container.png',false); //0
        webGL.createTexture('alphabet', 'textures/alphabet.png',false); //0

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
            {name: 'u_eyeOffset', type: '1f', value: 0},
            {name: 'u_color', type: '4fv', value: [1,1,1,1]}
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

        const depthRatio = Math.min(1, Math.max(0, (map.getSize() - camera[1] - map.getSize()/5) / 8));

        const fogColor = [
            (FOG_SKY_COLOR[0] * (1 - depthRatio)) + (FOG_UNDERGROUND_COLOR[0] * depthRatio),
            (FOG_SKY_COLOR[1] * (1 - depthRatio)) + (FOG_UNDERGROUND_COLOR[1] * depthRatio),
            (FOG_SKY_COLOR[2] * (1 - depthRatio)) + (FOG_UNDERGROUND_COLOR[2] * depthRatio)
        ];

        map.getForRender(camera, cameraFace, VIEW_DISTANCE + 5,p.vertexData);

        p.vertexData.forEach(bufferObj=>{
            webGL.updateDataTexture(bufferObj.name);
        });

        if (isVR)
            p.webGL.startBarrelCapture();

        for (let e = 0; e < (isVR?2:1); e++) {

            let tileShader = p.webGL._private.shaders['tile'];
            GL.useProgram(tileShader.shader);

            let cvec = glm.vec3.create();
            glm.vec3.scale(cvec, cameraRight, (isVR?(e - 0.5):0) * EYE_DISTANCE);
            if (isVR) {
                let tvec = glm.vec3.create();
                glm.vec3.scale(tvec, cameraFace, -0.35);
                glm.vec3.add(cvec, cvec, tvec);
            }
            glm.vec3.add(cvec, cvec, camera);
            webGL.renderStart(cvec, cameraFace, cameraUp, fogColor, e + (isVR?1:0),isVR?p.webGL._private.rttFramebuffer:null);

            p.vertexData.forEach(bufferObj=>{
                webGL.attachDataTexture(bufferObj.name, tileShader.shader, 31);
                p.mainVertexBufferKeep = webGL.render(tileShader, 'TRIANGLES', p.vertexIndexTracker, bufferObj.used / (6) * 6, 0, ['blocks'], {
                    u_camera_face: cameraFace,
                    u_camera: camera,
                    u_height: depthRatio
                }, null, p.mainVertexBufferKeep);
            });

            GL.disable(GL.DEPTH_TEST);

            let crossHairVertex = new Float32Array([
                0.05, -0.05, -1.5, 1.0, 0.0,
                0.05, 0.05, -1.5, 1.0, 1.0,
                -0.05, 0.05, -1.5, 0.0, 1.0,
                -0.05, -0.05, -1.5, 0.0, 0.0
            ]);
            p.webGL.render('gui', 'TRIANGLE_FAN', crossHairVertex, 4, 0, ['crosshair'],{u_eyeOffset:(isVR?(e - 0.5):0) * EYE_DISTANCE, u_color:[1,1,1,1]});

            let xScale = isVR?1.2:2;
            let yScale = 3;

            let inventoryVertex = new Float32Array([
                0.0, -0.2666*yScale, -1.5, 5.0, 0.0,
                0.0, -0.22666*yScale, -1.5, 5.0, 1.0,
                -0.4*xScale, -0.22666*yScale, -1.5, 0.0, 1.0,
                -0.4*xScale, -0.2666*yScale, -1.5, 0.0, 0.0
            ]);
            p.webGL.render('gui', 'TRIANGLE_FAN', inventoryVertex, 4, 0, ['inventory_container'],{u_eyeOffset:(isVR?(e - 0.5):0) * EYE_DISTANCE, u_color:[1,1,1,1]});

            let a = [];
            let cnti = 0;
            p.inventory.getBeltSlots().reverse().forEach((item,ind)=>{
                if (item) {
                    cnti++;
                    let block = BlockData[item.getProp('typeInd')];
                    let tex = block.texFaceInd[0] - 1;
                    let yOff = Math.floor(tex / 12) * 0.078125;
                    let xOff = (tex % 12) * 0.078125;

                    a = a.concat([
                        (-0.01333 - (0.08 * ind)) * xScale, -0.26 * yScale, -1.5, 0.0703125 + xOff, 0.0078125 + yOff,
                        (-0.01333 - (0.08 * ind)) * xScale, -0.23333 * yScale, -1.5, 0.0703125 + xOff, 0.0703125 + yOff,
                        (-0.06667 - (0.08 * ind)) * xScale, -0.23333 * yScale, -1.5, 0.0078125 + xOff, 0.0703125 + yOff,
                        (-0.01333 - (0.08 * ind)) * xScale, -0.26 * yScale, -1.5, 0.0703125 + xOff, 0.0078125 + yOff,
                        (-0.06667 - (0.08 * ind)) * xScale, -0.23333 * yScale, -1.5, 0.0078125 + xOff, 0.0703125 + yOff,
                        (-0.06667 - (0.08 * ind)) * xScale, -0.26 * yScale, -1.5, 0.0078125 + xOff, 0.0078125 + yOff
                    ]);
                }
            });
            if (cnti) {
                let itemVertex = new Float32Array(a);
                p.webGL.render('gui', 'TRIANGLES', itemVertex, cnti * 6, 0, ['blocks'], {u_eyeOffset: (isVR ? (e - 0.5) : 0) * EYE_DISTANCE, u_color:[1,1,1,1]});
            }

            a = [];
            cnti = 0;
            p.inventory.getBeltSlots().reverse().forEach((item,ind)=>{
                if (item) {
                    let qty = item.qty;
                    let numbers = [];
                    while (qty >= 10) {
                        numbers.push(qty%10);
                        qty = Math.floor(qty/10);
                    }
                    numbers.push(qty);

                    numbers.forEach((val,tenth)=> {
                        cnti++;
                        let us = (val%9) * 0.1015625;
                        let vs = Math.floor(val/9)*0.1171875;
                        let ue = us + 0.1015625;
                        let ve = vs + 0.1171875;

                        a = a.concat([
                            (-0.005-((tenth)*0.013)-(0.08*ind)) * xScale, -0.264667 * yScale, -1.5, ue, vs,
                            (-0.005-((tenth)*0.013)-(0.08*ind)) * xScale, -0.251333 * yScale, -1.5, ue, ve,
                            (-0.02-((tenth)*0.013)-(0.08*ind)) * xScale, -0.251333 * yScale, -1.5, us, ve,
                            (-0.005-((tenth)*0.013)-(0.08*ind)) * xScale, -0.264667 * yScale, -1.5, ue, vs,
                            (-0.02-((tenth)*0.013)-(0.08*ind)) * xScale, -0.251333 * yScale, -1.5, us, ve,
                            (-0.02-((tenth)*0.013)-(0.08*ind)) * xScale, -0.264667 * yScale, -1.5, us, vs
                        ]);
                    });
                }
            });
            if (cnti) {
                let itemVertex = new Float32Array(a);
                p.webGL.render('gui', 'TRIANGLES', itemVertex, cnti * 6, 0, ['alphabet'], {u_eyeOffset: (isVR ? (e - 0.5) : 0) * EYE_DISTANCE, u_color:[1,1,1,1]});
            }

            a = [];
            cnti = 0;
            p.inventory.getBeltSlots().forEach((item,ind)=>{
                if (4-ind!=p.inventory.beltSelected) {
                    cnti++;
                    let xs = (5 - ind) * 0.1015625;
                    let ys = 0;
                    let xe = xs + 0.1015625;
                    let ye = 0.1171875;

                    a = a.concat([
                        (-0.06 - (0.08 * ind)) * xScale, -0.242 * yScale, -1.5, xe, ys,
                        (-0.06 - (0.08 * ind)) * xScale, -0.22866 * yScale, -1.5, xe, ye,
                        (-0.075 - (0.08 * ind)) * xScale, -0.22866 * yScale, -1.5, xs, ye,
                        (-0.06 - (0.08 * ind)) * xScale, -0.242 * yScale, -1.5, xe, ys,
                        (-0.075 - (0.08 * ind)) * xScale, -0.22866 * yScale, -1.5, xs, ye,
                        (-0.075 - (0.08 * ind)) * xScale, -0.242 * yScale, -1.5, xs, ys
                    ]);
                }
            });
            let itemVertex = new Float32Array(a);
            p.webGL.render('gui', 'TRIANGLES', itemVertex, cnti * 6, 0, ['alphabet'], {u_eyeOffset: (isVR ? (e - 0.5) : 0) * EYE_DISTANCE, u_color:[1,1,0,1]});

            let ind = 4-p.inventory.beltSelected;
            cnti++;
            let xs = (5 - ind) * 0.1015625;
            let ys = 0;
            let xe = xs + 0.1015625;
            let ye = 0.1171875;

            a = [
                (-0.06 - (0.08 * ind)) * xScale, -0.242 * yScale, -1.5, xe, ys,
                (-0.06 - (0.08 * ind)) * xScale, -0.22866 * yScale, -1.5, xe, ye,
                (-0.075 - (0.08 * ind)) * xScale, -0.22866 * yScale, -1.5, xs, ye,
                (-0.06 - (0.08 * ind)) * xScale, -0.242 * yScale, -1.5, xe, ys,
                (-0.075 - (0.08 * ind)) * xScale, -0.22866 * yScale, -1.5, xs, ye,
                (-0.075 - (0.08 * ind)) * xScale, -0.242 * yScale, -1.5, xs, ys
            ];
            itemVertex = new Float32Array(a);
            p.webGL.render('gui', 'TRIANGLES', itemVertex, 6, 0, ['alphabet'], {u_eyeOffset: (isVR ? (e - 0.5) : 0) * EYE_DISTANCE, u_color:[0.2,1,0.2,1]});

            GL.enable(GL.DEPTH_TEST);
        }

        if (isVR) {
            p.webGL.endBarrelCapture();
            p.barrelVertexBufferKeep = p.webGL.renderBarrel(0, p.barrelVertexBufferKeep);
        }
    }
};