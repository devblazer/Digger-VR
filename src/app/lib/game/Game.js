import State from './../State.js';
import Control from './Control.js';

export default class Game {
    constructor(appState,renderer,map,input){
        const stateObj = {
            SELF_COL_RADIUS:0.75,
            SELF_COL_HEIGHT:2.5,
            SELF_EYE_HEIGHT:2,
            GRAVITY:0.5,
            JUMP_VELOCITY:10,
            MAX_FALL_SPEED:18,
            MOVE_SPEED:1.6,
            DIG_RATE:0.4,
            MAP_SIZE:map.getSize()
        };

        stateObj.MASS_DIG_FACES = [
            [
                [stateObj.SELF_COL_RADIUS/-2,-stateObj.SELF_EYE_HEIGHT+0.4,-stateObj.SELF_COL_RADIUS],
                [stateObj.SELF_COL_RADIUS/-2,stateObj.SELF_COL_HEIGHT-stateObj.SELF_EYE_HEIGHT+0.4,stateObj.SELF_COL_RADIUS]
            ],
            [
                [-stateObj.SELF_COL_RADIUS,0,-stateObj.SELF_COL_RADIUS],
                [stateObj.SELF_COL_RADIUS,0,stateObj.SELF_COL_RADIUS]
            ],
            [
                [-stateObj.SELF_COL_RADIUS,-stateObj.SELF_EYE_HEIGHT+0.4,stateObj.SELF_COL_RADIUS/-2],
                [stateObj.SELF_COL_RADIUS,stateObj.SELF_COL_HEIGHT-stateObj.SELF_EYE_HEIGHT+0.4,stateObj.SELF_COL_RADIUS/-2]
            ],
            [
                [stateObj.SELF_COL_RADIUS/2,-stateObj.SELF_EYE_HEIGHT+0.4,-stateObj.SELF_COL_RADIUS],
                [stateObj.SELF_COL_RADIUS/2,stateObj.SELF_COL_HEIGHT-stateObj.SELF_EYE_HEIGHT+0.4,stateObj.SELF_COL_RADIUS]
            ],
            [
                [-stateObj.SELF_COL_RADIUS,0,-stateObj.SELF_COL_RADIUS],
                [stateObj.SELF_COL_RADIUS,0,stateObj.SELF_COL_RADIUS]
            ],
            [
                [-stateObj.SELF_COL_RADIUS,-stateObj.SELF_EYE_HEIGHT+0.4,stateObj.SELF_COL_RADIUS/2],
                [stateObj.SELF_COL_RADIUS,stateObj.SELF_COL_HEIGHT-stateObj.SELF_EYE_HEIGHT+0.4,stateObj.SELF_COL_RADIUS/2]
            ]
        ];

        const p = this._private = {
            renderer,
            map,
            state:new State(stateObj),
            shutDown: false
        };

        p.state.set({
        });

        p.control = new Control(
            p.state.feed(),
            map,
            [appState.mapSize / 2, appState.mapSize - 5, appState.mapSize / 2],
            [0, 0, -1],
            [0, 1, 0],
            input
        );

        p.state.set('gameActive',true);
        p.lastTime = (new Date()).getTime();

        const me = this;

        const loop = function(){
            if (p.shutdown)
                return;
            me.step();
            me.render();
            window.requestAnimationFrame(loop);
        };
        window.requestAnimationFrame(loop);
    }

    step(){
        const p = this._private;

        var newTime = (new Date()).getTime();
        var delta = (newTime - p.lastTime) / 1000;
        p.lastTime = newTime;

        p.control.step(delta);
    }

    render(){
        const p = this._private;
        const cams = p.control.getCamera();

        p.renderer.render(p.map,cams[0], cams[1], cams[2], cams[3], cams[4]);
    }

    destroy(){
        this._private.shutdown = true;
    }
}