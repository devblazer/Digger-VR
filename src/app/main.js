require('./main.css');
import App from './lib/game/App.js';
import Map from './lib/game/Map.js';
import Comms from './lib/data/Comms.js';

if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body)
    run();
else
    window.addEventListener('DOMContentLoaded', run, false);

function run() {
    const comms = new Comms(true );
    const app = new App(comms);
    const map = new Map(comms,64);
    map.new(()=>{
        app.newGame(map);
    });
}

