import State from './../State.js';
import Map from './Map.js';
import Game from './Game.js';
import Renderer from './../render/Renderer.js';
import Comms from './../data/Comms.js';
import Input from './Input.js';
import Sound from './Sound.js';
import Inventory from './Inventory.js';
import IndexedDB from './../data/IndexedDB.js';
import md5 from 'md5';

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
            sound: new Sound(),
            lastProgress:0,
            inventory: new Inventory()
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
            map = null;
        }

        if (!map) {
            map = new Map(p.comms, p.state.get('mapSize'),this.setProgress.bind(this));
            map.new(()=> {
                this.setProgress();
                p.game = new Game(p.state.export(),p.renderer,map,p.input,p.sound,p.inventory);
            },p.db,gameName);
        }
        else {
            p.state.set('mapSize', map.getSize());
            this.setProgress();
            p.game = new Game(p.state.export(), p.renderer, map, p.input,p.sound,p.inventory);
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

        let map = new Map(p.comms, p.state.get('mapSize'),this.setProgress.bind(this));
        map.load(game.id,p.db,()=> {
            this.setProgress();
            p.game = new Game(p.state.export(),p.renderer,map,p.input,p.sound,p.inventory);
        });
    }

    deleteGame(gameID) {
        this._private.comms.emit('delete_game',gameID);
    }

    setProgress(val=null) {
        const p = this._private;

        if (val && p.lastProgress > (new Date()).getTime() - 100)
            return;

        p.lastProgress = (new Date()).getTime();
        if (val===null)
            document.getElementById('progress_bar').style.display = 'none';
        else {
            document.getElementById('progress_bar').style.display = 'block';
            document.getElementById('progress_bar_inner').style.width = Math.floor(val*100)/100+'%';
        }
    }
    
    attemptLogin(username,password,callback) {
        const p = this._private;

        p.comms.fetch('get_salt',username,res=>{
            if (!res.status)
                callback(false);
            else
                p.comms.fetch('attempt_login',[username,md5(password+res.salt)],res=>{
                    if (callback)
                        callback(res.status);
                    else 
                        Input.openMenu();
                });
        });
    }

    attemptRegister(username,password,callback) {
        const p = this._private;

        p.comms.fetch('new_salt',username,res=>{
            if (!res.status)
                callback('username already exists!');
            else
                p.comms.fetch('attempt_register',[username,md5(password+res.salt),res.salt],res=>{
                    callback(res.status?false:'failed to create new user');
                });
        });
    }

    get inventory() {
        return this._private.inventory;
    }
}