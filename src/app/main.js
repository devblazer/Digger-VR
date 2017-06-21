require('./main.css');
import App from './lib/game/App.js';
import Map from './lib/game/Map.js';
import Comms from './lib/data/Comms.js';
import Input from './lib/game/Input.js';
var credentials = null;
try {
    credentials = require('./credentials.json');
}
catch (e) {
    // do nothing
}

if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body)
    run();
else
    window.addEventListener('DOMContentLoaded', run, false);

const DEV_ALERT = false;
const AUTO_LOGIN = credentials;

function run() {
    const app = window.app = new App();

    if (DEV_ALERT)
        alert('WARNING!!!  Please note this game is under active development and as such your games/account may at times be deleted without any notice before, during or after the fact.');

    if (AUTO_LOGIN)
        app.attemptLogin(AUTO_LOGIN[0],AUTO_LOGIN[1]);
    else
        Input.openLogin();
}

