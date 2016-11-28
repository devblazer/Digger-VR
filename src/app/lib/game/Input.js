import $ from 'jquery';

const supportsPointerLock = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;

document.body.requestPointerLock = document.body.requestPointerLock ||
    document.body.mozRequestPointerLock ||
    document.body.webkitRequestPointerLock;

document.exitPointerLock = document.exitPointerLock ||
    document.mozExitPointerLock ||
    document.webkitExitPointerLock;

document.body.requestFullscreen =
    document.body.requestFullscreen
    || document.body.mozRequestFullScreen
    || document.body.webkitRequestFullScreen
    || document.body.msRequestFullScreen;

const KEYS = {
    87:'forward',
    83:'back',
    65:'left',
    68:'right',
    32:'up',
    18:'down'
};

const KEYS2AXES = {
    left:0,
    right:3,
    down:1,
    up:4,
    forward:2,
    back:5
};

const GAMEPADAXISMAP = {
    0:'moveX',
    1:'moveZ',
    2:'rotateY',
    3:'rotateX'
};
const GAMEPADBUTTONMAP = {
    6:'up',
    7:'dig',
    13:'up',
    12:'down'
};
const ACTIONS = [
    'dig'
];
const MOUSE2ACTION = {
    0:'dig'
};

const MOUSE_X_SPEED = 0.3;
const MOUSE_Y_SPEED = 0.3;
const KEY_MOVE_SPEED = 3;
const GAMEPAD_MOVE_SPEED = 3;
const GAMEPAD_ROTATE_SPEED = 150;

const processGamepadState = ()=>{
    const gp = navigator.getGamepads()[0];
    const actions = {moveX:0,moveY:0,moveZ:0,rotateX:0,rotateY:0,up:0,down:0,left:0,right:0,forward:0,back:0,turnLeft:0,turnRight:0,turnUp:0,turnDown:0,primary:0,dig:0};

    if (gp && gp.axes)
        gp.axes.forEach((axis,ind)=>{
            if (GAMEPADAXISMAP[ind])
                actions[GAMEPADAXISMAP[ind]] += (axis<0.1&&axis>-0.1?0:axis);
        });
    if (gp && gp.buttons) {
        gp.buttons.forEach((button,ind)=>{
            if (GAMEPADBUTTONMAP[ind])
                actions[GAMEPADBUTTONMAP[ind]] += button.pressed?1:0;
        });
    }
    return actions;
};

const bindTap = function(el,callback,bubble=false) {
    el.addEventListener('click',callback,bubble);
    el.addEventListener('touchstart',callback,bubble);
};

let menuIsOpen = false;
const closeAllUIPanels = function(){
    menuIsOpen = false;
    document.querySelectorAll('.ui-panel.open').forEach(el=>{
        el.className = el.className.replace(/\s*open|open\s*/,'');
    });
};

const openMenu = function(){
    document.getElementById('open_menu').className += ' active';
    openPanel('ui_menu');
};

const openPanel = function(panelID){
    closeAllUIPanels();
    menuIsOpen = true;
    document.getElementById(panelID).className += ' open';
};

export default class Input {
    constructor(app) {
        const p = this._private = {
            app,
            pointerLocked: false,
            mouseXmoved: 0,
            mouseYmoved: 0,
            mouseDown:[0,0,0,0,0,0,0,0],
            mouseActions:[],
            axisStates: [0, 0, 0,0,0,0] // leftright, downup, forwardback
        };
        this.allowPointerLock = true;
        this.allowFullScreen = true;
        this.allowKeyboard = true;
        this.allowGamepad = true;
        const me = this;

        if (supportsPointerLock) {
            bindTap(document.body,e=>{
                if (e.target.nodeName=='CANVAS') {
                    if (me.allowFullScreen)
                        document.body.requestFullscreen();
                    if (me.allowPointerLock && document.body.requestPointerLock && !p.pointerLocked)
                        document.body.requestPointerLock();
                }
            },true);

            const pointerLockChanged = e=> {
                p.pointerLocked = (document.pointerLockElement === document.body || document.mozPointerLockElement === document.body || document.webkitPointerLockElement === document.body);
            };
            document.addEventListener('pointerlockchange', pointerLockChanged, false);
            document.addEventListener('mozpointerlockchange', pointerLockChanged, false);
            document.addEventListener('webkitpointerlockchange', pointerLockChanged, false);
            document.addEventListener('mousemove', e=> {
                if (p.pointerLocked) {
                    p.mouseXmoved += (e.movementX || e.mozMovementX || e.webkitMovementX || 0);
                    p.mouseYmoved += (e.movementY || e.mozMovementY || e.webkitMovementY || 0);
                }
            }, false);
        }

        document.addEventListener('mousedown',e=>{
            if (!menuIsOpen && MOUSE2ACTION[e.button] && p.pointerLocked) {
                p.mouseDown[e.button] = 1;
                p.mouseActions[MOUSE2ACTION[e.button]] = 1;
            }
        },true);
        document.addEventListener('mouseup',e=>{
            if (MOUSE2ACTION[e.button] && p.pointerLocked) {
                p.mouseDown[e.button] = 0;
                p.mouseActions[MOUSE2ACTION[e.button]] = 0;
            }
        },true);

        document.addEventListener('keydown',e=>{
            if (!menuIsOpen && KEYS[e.which||e.keyCode]) {
                p.axisStates[KEYS2AXES[KEYS[e.which || e.keyCode]]] = 1;
                e.preventDefault();
            }
        },true);
        document.addEventListener('keyup',e=>{
            if (KEYS[e.which||e.keyCode]) {
                p.axisStates[KEYS2AXES[KEYS[e.which || e.keyCode]]] = 0;
                e.preventDefault();
            }
        },true);

        bindTap(document.getElementById('open_menu'),openMenu);
        bindTap(document.getElementById('new_game'),()=>{
            document.getElementById('game_name').value = '';
            openPanel('ui_new_game');
        });
        bindTap(document.getElementById('load_game'),()=>{openPanel('ui_load_game')});
        bindTap(document.getElementById('controls'),()=>{openPanel('ui_controls')});

        bindTap(document.body,e=>{
            if (e.target.className == 'close') {
                if (e.target.rel)
                    openPanel(e.target.rel);
                else
                    closeAllUIPanels();
            }
        },true);

        bindTap(document.getElementById('map_size'),e=>{
            if (e.target.rel) {
                const gameNameEl = document.getElementById('game_name');
                if (!gameNameEl.value.replace(/\s/g,''))
                    alert('Please fill in a game name first');
                else {
                    app.newGame(e.target.rel/1);
                    closeAllUIPanels();
                }
            }
        },true);
    }

    static openMenu(){
        openMenu();
    }

    getMouseMoved(reset=true){
        const p = this._private;
        const mouseMoved = [p.mouseXmoved,p.mouseYmoved];
        if (reset) {
            p.mouseXmoved = 0;
            p.mouseYmoved = 0;
        }
        return mouseMoved;
    }

    getAllActions(delta){
        const p = this._private;
        const actions = {moveX:0,moveY:0,moveZ:0,rotateX:0,rotateY:0};

        const mm = this.getMouseMoved();
        actions.rotateY += mm[0]*MOUSE_X_SPEED;
        actions.rotateX += mm[1]*MOUSE_Y_SPEED;

        actions.moveX += (p.axisStates[3]-p.axisStates[0])*delta*KEY_MOVE_SPEED;
        actions.moveY += (p.axisStates[4]-p.axisStates[1])*delta*KEY_MOVE_SPEED;
        actions.moveZ += (p.axisStates[5]-p.axisStates[2])*delta*KEY_MOVE_SPEED;

        const gp = processGamepadState();
        actions.moveX += (gp.right - gp.left + gp.moveX) * GAMEPAD_MOVE_SPEED * delta;
        actions.moveY += (gp.up - gp.down + gp.moveY) * GAMEPAD_MOVE_SPEED * delta;
        actions.moveZ += (gp.back - gp.forward + gp.moveZ) * GAMEPAD_MOVE_SPEED * delta;
        actions.rotateY += (gp.turnRight - gp.turnLeft + (gp.rotateY*2)) * GAMEPAD_ROTATE_SPEED * delta;
        actions.rotateX += (gp.turnUp - gp.turnDown + gp.rotateX) * GAMEPAD_ROTATE_SPEED * delta;

        ['moveX','moveY','moveZ'].forEach(item=>{
            actions[item] = Math.min(1,Math.max(-1,actions[item]));
        });

        ACTIONS.forEach(action=>{
            actions[action] = gp[action] || p.mouseActions[action];
        });

        return actions;
    }
}