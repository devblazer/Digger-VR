import State from './../State.js';
import Map from './Map.js';
import MapGenerator from './../generation/MapGenerator.js';
import Game from './Game.js';
import Renderer from './../render/Renderer.js';
import Comms from './../data/Comms.js';
import Input from './Input.js';

export default class App {
    constructor(comms){
        comms = comms || new Comms();
        const p = this._private = {
            state:new State({
            }),
            game:null,
            comms,
            input:new Input(this)
        };
        p.state.set({
            mapSize:32
        });
        p.renderer = new Renderer(p.state.export());
    }

    newGame(map=null){
        const p = this._private;

        if (typeof map=='number') {
            p.state.set('mapSize', map);
            map = null;
        }

        if (!map) {
            map = new Map(p.comms, p.state.get('mapSize'));
            map.new(()=> {
                p.game = new Game(p.state.export(),p.renderer,map,p.input);
            });
        }
        else {
            p.state.set('mapSize', map.getSize());
            p.game = new Game(p.state.export(), p.renderer, map, p.input);
        }
    }
}