import State from './../State.js';
import Map from './Map.js';
import MapGenerator from './../generation/MapGenerator.js';
import Game from './Game.js';
import Renderer from './../render/Renderer.js';

export default class App {
    constructor(){
        const p = this._private = {
            state:new State({
            }),
            game:null,
        };
        p.state.set({
            mapSize:32
        });
        p.renderer = new Renderer(p.state.export());
    }

    newGame(map=null){
        const p = this._private;
        const mapSize = p.state.get('mapSize');

        if (!map) {
            map = new Map(mapSize);
            const gen = new MapGenerator(map);
            console.log(gen.autoGenerate());
        }

        p.game = new Game(p.state.export(),p.renderer,map);
    }
}