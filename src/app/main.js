require('./main.css');
import App from './lib/game/App';

if (['complete', 'loaded', 'interactive'].includes(document.readyState) && document.body)
    run();
else
    window.addEventListener('DOMContentLoaded', run, false);

function run() {
    let app = new App();
    app.newGame();
}

