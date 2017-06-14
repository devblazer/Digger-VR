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
            input:new Input(this),
            gamesList:[]
        };
        p.state.set({
            mapSize:32
        });
        p.renderer = new Renderer(p.state.export());

        comms.on('user_games_list',gamesList=>{
            p.gamesList = gamesList;
            document.getElementById('load_game_list').innerHTML = gamesList.reduce((aggr,game)=>{
                return aggr+`<li><a rel="${game.id}">${game.name} (${game.mapSize})<span rel="delete">X</span></a></li>`;
            },'');
        });
    }

    newGame(map=null,gameName='test'){
        const p = this._private;
        if (p.game)
            p.game.destroy();

        if (typeof map=='number') {
            p.state.set('mapSize', map);
            console.log(map);
            map = null;
        }

        if (!map) {
            map = new Map(p.comms, p.state.get('mapSize'));
            map.new(()=> {
                p.game = new Game(p.state.export(),p.renderer,map,p.input);
            },gameName);
        }
        else {
            p.state.set('mapSize', map.getSize());
            p.game = new Game(p.state.export(), p.renderer, map, p.input);
        }
    }

    loadGame(gameID){
        const p = this._private;
        let game = p.gamesList.filter(game=>{
            return game.id == gameID;
        })[0];

        if (p.game)
            p.game.destroy();

        p.state.set('mapSize', game.mapSize);

        let map = new Map(p.comms, p.state.get('mapSize'));
        map.load(game.id,()=> {
            p.game = new Game(p.state.export(),p.renderer,map,p.input);
        });
    }

    deleteGame(gameID) {
        this._private.comms.emit('delete_game',gameID);
    }
}