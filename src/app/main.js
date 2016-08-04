require('./main.css');
import Util from './lib/Util.js';
import WebGL from './lib/render/WebGL.js';
import Input from './lib/game/Input.js';
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

    webGL.createTexture('grass','/textures/grass.png');
    webGL.createTexture('grassEdge','/textures/grassEdge.png');
    webGL.createTexture('dirt','/textures/dirt.png');
    webGL.createTexture('stone','/textures/stone.png');

    webGL.createShader('tile', TileVert, TileFrag, [
        {name: 'a_position', size: 4, count: 4, type: 'FLOAT'},
        {name: 'a_size', size: 4, count: 1, type: 'FLOAT'}/*,
        {name: 'a_uv', size: 4, count: 2, type: 'FLOAT'}*/
    ],
    [
        {name: 'u_ambient',type:'1f',value:0.3},
        {name: 'u_directional',type:'3fv',value:[-0.3,-0.5,-0.2]},
        {name: 'u_normuv',type:'1fv',value:[
            // x-
            -1, 0, 0, 0, 0,
            -1, 0, 0, 1, 0,
            -1, 0, 0, 0, 1,
            -1, 0, 0, 0, 1,
            -1, 0, 0, 1, 0,
            -1, 0, 0, 1, 1,
            // y-
            0, -1, 0, 0, 0,
            0, -1, 0, 1, 0,
            0, -1, 0, 0, 1,
            0, -1, 0, 0, 1,
            0, -1, 0, 1, 0,
            0, -1, 0, 1, 1,
            // z-
            0, 0, -1, 0, 0,
            0, 0, -1, 1, 0,
            0, 0, -1, 0, 1,
            0, 0, -1, 0, 1,
            0, 0, -1, 1, 0,
            0, 0, -1, 1, 1,
            // x+
            1, 0, 0, 0, 0,
            1, 0, 0, 1, 0,
            1, 0, 0, 0, 1,
            1, 0, 0, 0, 1,
            1, 0, 0, 1, 0,
            1, 0, 0, 1, 1,
            // y+
            0, 1, 0, 0, 0,
            0, 1, 0, 1, 0,
            0, 1, 0, 0, 1,
            0, 1, 0, 0, 1,
            0, 1, 0, 1, 0,
            0, 1, 0, 1, 1,
            // z+
            0, 0, 1, 0, 0,
            0, 0, 1, 1, 0,
            0, 0, 1, 0, 1,
            0, 0, 1, 0, 1,
            0, 0, 1, 1, 0,
            0, 0, 1, 1, 1
        ]}
    ]);

    var lastTime = (new Date()).getTime();

    const mapSize = 512;
    const camera = glm.vec3.fromValues(mapSize/2,mapSize-4,mapSize/2);

    const cameraFace = glm.vec3.fromValues(0,0,-1);
    const cameraUp = glm.vec3.fromValues(0,1,0);
    const cameraForward = glm.vec3.create();
    const cameraRight = glm.vec3.create();

    let faces;
    function render() {
        var newTime = (new Date()).getTime();
        var delta = (newTime - lastTime) / 1000;
        lastTime = newTime;

        step(delta);

        webGL.renderStart(camera,cameraFace,cameraUp);

        let tiles;
        let tileGroups = map.getForRender(camera,cameraFace,VIEW_DISTANCE+5);

        faces = 0;
        for (let p in tileGroups)
            if (tileGroups.hasOwnProperty(p)) {
                tiles = tileGroups[p];
                faces += (tiles.count/30);
                webGL.render('tile', 'TRIANGLES', tiles.buf, tiles.count / 5,0,[p]);
            }

        requestAnimationFrame(render);
    }

    const map = new Map(mapSize);
    const gen = new MapGenerator(map);

    console.log(gen.autoGenerate());

    const input = new Input();
    render();
    console.log('map mem: '+Math.floor(map.getMemoryUsage()/1000)+'KB');
    console.log('faces: '+Math.floor(faces/1000)+'KB');
    console.log('face mem: '+Math.floor(faces/1000*30*2*4)+'KB');

    function step(delta) {

        // mouse
        let mm = input.getMouseMoved();

        if (mm[0])
            glm.vec3.rotateY(cameraFace,cameraFace,glm.vec3.fromValues(0,0,0),Util.deg2Rad(-mm[0])/3);
        if (mm[1]) {
            if ((cameraFace[1]>-0.99 || mm[1] < 0) && (cameraFace[1]<0.99 || mm[1] > 0)) {
                let q = glm.quat.create();
                let r = glm.vec3.create();
                glm.vec3.cross(r, cameraFace, cameraUp);
                glm.quat.setAxisAngle(q, r, -mm[1] / 180);
                glm.vec3.transformQuat(cameraFace, cameraFace, q);
                glm.vec3.normalize(cameraFace, cameraFace);
            }
        }
        glm.vec3.cross(cameraRight,cameraFace,cameraUp);
        cameraRight[1] = 0;
        glm.vec3.normalize(cameraRight,cameraRight);
        glm.vec3.cross(cameraForward,cameraRight,cameraUp);


        // keyboard
        let speed = 3;
        let t;

        let x = input.getAxisState(0);
        t = glm.vec3.create();
        glm.vec3.scale(t,cameraRight,delta*x*speed);
        glm.vec3.add(camera,camera,t);

        let y = input.getAxisState(1);
        t = glm.vec3.create();
        glm.vec3.scale(t,cameraUp,delta*y*speed);
        glm.vec3.add(camera,camera,t);

        let z = input.getAxisState(2);
        t = glm.vec3.create();
        glm.vec3.scale(t,cameraForward,delta*z*speed);
        glm.vec3.add(camera,camera,t);

        //storage.step(delta);
    }
}

