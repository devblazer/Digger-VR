import State from './../State.js';
import Map from './Map.js';
import MapGenerator from './../generation/MapGenerator.js';
import Game from './Game.js';
import Renderer from './../render/Renderer.js';
import Comms from './../data/Comms.js';

export default class App {
    constructor(comms){
        comms = comms || new Comms();
        const p = this._private = {
            state:new State({
            }),
            game:null,
            comms
        };
        p.state.set({
            mapSize:32
        });
        p.renderer = new Renderer(p.state.export());
    }

    newGame(map=null){
        const p = this._private;
        let mapSize;

        if (!map) {
            map = new Map(comms,p.state.get('mapSize'));
            const gen = new MapGenerator(map);
            console.log(gen.autoGenerate());
        }
        else
            p.state.set('mapSize',map.getSize());

        p.game = new Game(p.state.export(),p.renderer,map);
    }
}