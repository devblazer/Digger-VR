require('./main.css');
import Util from './lib/Util.js';
import WebGL from './lib/render/WebGL.js';
import Sector from './lib/game/Sector.js';
import Map from './lib/game/Map.js';
import MapGenerator from './lib/generation/MapGenerator.js';
import Tile from './lib/render/Tile.js';

import TileFrag from './lib/render/shaders/tile/fragment.glsl';
import TileVert from './lib/render/shaders/tile/vertex.glsl';

if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body)
    run();
else
    window.addEventListener('DOMContentLoaded', run, false);

function run() {
    const webGL = new WebGL(true);

    webGL.createTexture('grass','/textures/grass.png');
    webGL.createTexture('grassEdge','/textures/grassEdge.png');
    webGL.createTexture('dirt','/textures/dirt.png');
    webGL.createTexture('stone','/textures/stone.png');

    webGL.createShader('tile', TileVert, TileFrag, [
        {name: 'a_position', size: 4, count: 3, type: 'FLOAT'},
        {name: 'a_normal', size: 4, count: 3, type: 'FLOAT'},
        {name: 'a_uv', size: 4, count: 2, type: 'FLOAT'}
    ],
    [
        {name: 'u_uvst',type:'1fv',value:[0,0.5]}
    ]);

    var lastTime = (new Date()).getTime();
    const camera = [120,100, 200];
let faces;
    function render() {
        var newTime = (new Date()).getTime();
        var delta = (newTime - lastTime) / 1000;
        lastTime = newTime;

        step(delta);

        webGL.renderStart(camera);

        let tiles;
        let tileGroups = map.getForRender();

        //console.log(tileGroups);
        faces = 0;
        for (let p in tileGroups)
            if (tileGroups.hasOwnProperty(p)) {
                tiles = tileGroups[p];
                //console.log(p);
                faces += (tiles.length/48);
                webGL.render('tile', 'TRIANGLES', tiles, tiles.length / 8,0,[p]);
            }
        requestAnimationFrame(render);
    }

    //const sector = new Sector();
    const size = 64;
    const map = new Map(size);
//    const gen = new MapGenerator(map);
//    gen.autoGenerate();
    map.fill(0,size-1,0,2,size,1,size);
    map.fill(0,0,0,1,size,size-1,size);
    //map.fill(0,0,0,1,size,size,size);

    render();
    console.log(faces);

    function step(delta) {
        //storage.step(delta);
    }
}

