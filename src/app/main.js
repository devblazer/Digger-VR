require('./main.css');
import App from './lib/game/App.js';
import Map from './lib/game/Map.js';
import Comms from './lib/data/Comms.js';
import Input from './lib/game/Input.js';

if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body)
    run();
else
    window.addEventListener('DOMContentLoaded', run, false);

const DEBUG_MODE = 64;

function run() {
    if (DEBUG_MODE) {
        const comms = new Comms(true);
        const app = new App(comms);
        const map = new Map(comms, DEBUG_MODE);
        map.new(()=> {
            app.newGame(map);
        });
    }
    else {
        const app = new App();
        Input.openMenu();
    }
}

