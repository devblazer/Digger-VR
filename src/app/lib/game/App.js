import State from './../State.js';
import Map from './Map.js';
import Game from './Game.js';
import Renderer from './../render/Renderer.js';
import Comms from './../data/Comms.js';
import Input from './Input.js';
import Sound from './Sound.js';
import IndexedDB from './../data/IndexedDB.js';

export default class App {
    constructor(comms){
        comms = comms || new Comms();
        const p = this._private = {
            state: new State({
            }),
            game: null,
            comms,
            input: new Input(this),
            gamesList:[],
            db: new IndexedDB('Digger-VR'),
            sound: new Sound()
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

        /*p.db = new IndexedDB('test',()=>{
            p.db.createTable('t1',()=>{
                p.db.t1.save({id:'a'+Math.random(),x:0,y:0,z:0,data:'tester1'},()=>{console.log('saved')});
            });
        });*/
    }

    newGame(map=null,gameName='test'){
        const p = this._private;
        if (p.game)
            p.game.destroy();

        if (typeof map=='number') {
            p.state.set('mapSize', map);
            map = null;
        }

        if (!map) {
            map = new Map(p.comms, p.state.get('mapSize'));
            map.new(()=> {
                p.game = new Game(p.state.export(),p.renderer,map,p.input,p.sound);
            },p.db,gameName);
        }
        else {
            p.state.set('mapSize', map.getSize());
            p.game = new Game(p.state.export(), p.renderer, map, p.input,p.sound);
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
        map.load(game.id,p.db,()=> {
            p.game = new Game(p.state.export(),p.renderer,map,p.input,p.sound);
        });
    }

    deleteGame(gameID) {
        this._private.comms.emit('delete_game',gameID);
    }
}