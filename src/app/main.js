require('./main.css');
import Map from './lib/game/Map.js';
import MapGenerator from './lib/generation/MapGenerator.js';
import Plot from './lib/game/Plot.js';
import Sector from './lib/game/Sector.js';
//import Util from './lib/Util.js';
//import WebGL from './lib/render/WebGL.js';

if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body)
    run();
else
    window.addEventListener('DOMContentLoaded', run, false);

function run() {
/*    //const webGL = new WebGL(true);
    let lastFPS = 0;
    var lastTime = (new Date()).getTime();
    const camera = [0,0,10];

    function render(){
        var newTime = (new Date()).getTime();
        var delta = (newTime - lastTime)/1000;
        lastTime = newTime;

        let fps = delta?(1/delta):10;
        fps = (fps+lastFPS)/2;
        Debugger.set('fps',Math.ceil(fps));
        lastFPS = fps;

        step(delta);

/*        const arenaHalfSize = this.getHalfSize();

        webGL.renderStart(camera);

        let vtx;
        let lines = [];

        vtx = new Float32Array(lines);
        webGL.render('lines','LINES',vtx,lines.length/7);

        ////////////////    RENDER STARS
        self.stars.update(this,cameraPosition,self.lastCamera);
        vtx = new Float32Array(self.stars.getForRender());
        self.webGL.render('stars','POINTS',vtx,self.stars.getCount());

        ////////////////    CLEANUP
        self.lastCamera = self.camera.getPosition().slice();


        //Debugger.render();

        requestAnimationFrame(render);
    }

    render();

    function step(delta) {
        Debugger.step(delta);
        //storage.step(delta);
    }*/

    const map = new Map(64);
    const generator = new MapGenerator(map);
    console.log(generator.autoGenerate());
    console.log(Math.floor(map.getMemoryUsage()/1000)+'KB');
}

