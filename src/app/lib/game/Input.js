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
    18:'down',
    49:'inv1',
    50:'inv2',
    51:'inv3',
    52:'inv4',
    53:'inv5',
    16:'planar'
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
    7:'dig'
};
const ACTIONS = [
    'dig',
    'inv1',
    'inv2',
    'inv3',
    'inv4',
    'inv5',
    'planar'
];
const MOUSE2ACTION = {
    0:'dig'
};

const DEFINABLE_ACTIONS = new Map();
DEFINABLE_ACTIONS.set('dig','Dig');
DEFINABLE_ACTIONS.set('up','Jump');
DEFINABLE_ACTIONS.set('inv1','Inventory 1');
DEFINABLE_ACTIONS.set('inv2','Inventory 2');
DEFINABLE_ACTIONS.set('inv3','Inventory 3');
DEFINABLE_ACTIONS.set('inv4','Inventory 4');
DEFINABLE_ACTIONS.set('inv5','Inventory 5');
DEFINABLE_ACTIONS.set('planar','Planar Building');

const MOUSE_X_SPEED = 0.3;
const MOUSE_Y_SPEED = 0.3;
const KEY_MOVE_SPEED = 3;
const GAMEPAD_MOVE_SPEED = 3;
const GAMEPAD_ROTATE_SPEED = 150;

const processGamepadState = ()=>{
    const gp = navigator.getGamepads()[0];
    const actions = {moveX:0,moveY:0,moveZ:0,rotateX:0,rotateY:0,up:0,down:0,left:0,right:0,forward:0,back:0,turnLeft:0,turnRight:0,turnUp:0,turnDown:0,primary:0,dig:0,inv1:0,inv2:0,inv3:0,inv4:0,inv5:0,planar:0};

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
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('ui_taskbar').className = '';
    document.getElementById('open_menu').className += ' active';
    openPanel('ui_menu');
};

const openLogin = function(){
    openPanel('ui_login');
};

const toggleVR = function(){
    const p = this._private;
    p.isVR = !p.isVR;
    document.getElementById('toggle_vr').className = 'ui-icon-cardboard'+(p.isVR?' active':'');
};

const openPanel = function(panelID){
    closeAllUIPanels();
    menuIsOpen = true;
    document.getElementById(panelID).className += ' open';
};

const setRedefining = function(start=null) {
    const p = this._private;
    p.isRedefining = start;

    document.getElementById('control_define_list').innerHTML = [...DEFINABLE_ACTIONS.entries()].reduce((aggr,entry)=>{
        let buttons = [];
        for (let b in GAMEPADBUTTONMAP)
            if (GAMEPADBUTTONMAP[b]==entry[0] && buttons.indexOf(b)==-1) {
                buttons.push('GP'+b);
            }
        return aggr+`
            <li><a rel="${entry[0]}">${start==entry[0]?'<i>':''}
                ${entry[1]} = ${start==entry[0]?'press a game pad button...':(buttons.length?buttons.join(','):'undefined')}
            ${start==entry[0]?'</i>':''}</a></li>
        `;
    },'');

    if (p.isRedefiningLoop)
        window.clearInterval(p.isRedefiningLoop);
    if (start)
        p.isRedefiningLoop = window.setInterval(()=>{
            let gp = navigator.getGamepads();
            if (gp.length && gp[0] && gp[0].buttons)
                gp[0].buttons.forEach((button,ind)=>{
                    if (button.pressed) {
                        for (let a in GAMEPADBUTTONMAP) {
                            if (GAMEPADBUTTONMAP[a]==start)
                                delete(GAMEPADBUTTONMAP[a]);
                        }
                        GAMEPADBUTTONMAP[ind] = start;
                        setRedefining.call(this);
                    }
                });
        },25);
};

const check_userpass = function() {
    if (!document.getElementById('username').value.replace(/^\s+|\s+$/g,'')) {
        alert('Username is blank!');
        return false;
    }
    if (!document.getElementById('password').value.replace(/^\s+|\s+$/g,'')) {
        alert('Password is blank!')
        return false;
    }
    return true;
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
            axisStates: [0, 0, 0,0,0,0], // leftright, downup, forwardback
            keyStates:{},
            lastActions:{},
            actionsPressed:{},
            isRedefining: null,
            isRedefiningLoop: null,
            isVR: false,
            loggedIn: false
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
            if(p.isRedefining)
                setRedefining.call(me);
        },true);

        document.addEventListener('keydown',e=>{
            if (!menuIsOpen && KEYS[e.which||e.keyCode]) {
                p.keyStates[e.which||e.keyCode] = true;
                p.axisStates[KEYS2AXES[KEYS[e.which || e.keyCode]]] = 1;
                e.preventDefault();
            }
        },true);
        document.addEventListener('keyup',e=>{
            if (KEYS[e.which||e.keyCode]) {
                p.keyStates[e.which||e.keyCode] = false;
                p.axisStates[KEYS2AXES[KEYS[e.which || e.keyCode]]] = 0;
                e.preventDefault();
            }
            if(p.isRedefining)
                setRedefining.call(me);
        },true);

        bindTap(document.getElementById('open_menu'),openMenu);
        bindTap(document.getElementById('toggle_vr'),toggleVR.bind(this));
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
                    app.newGame(e.target.rel/1,gameNameEl.value);
                    closeAllUIPanels();
                }
            }
        },true);

        bindTap(document.getElementById('load_game_list'),e=>{
            let rel = e.target.getAttribute('rel');
            if (rel) {
                if (rel == 'delete') {
                    e.target.parentNode.parentNode.style.display = 'none';
                    app.deleteGame(e.target.parentNode.rel);
                }
                else {
                    app.loadGame(rel);
                    closeAllUIPanels();
                }
            }
        },true);

        setRedefining.call(me);
        bindTap(document.getElementById('control_define_list'),e=>{
            let rel = e.target.getAttribute('rel');
            if (rel && !p.isRedefining)
                setRedefining.call(me, rel);
        });

        bindTap(document.getElementById('btn_login'),()=>{
            if (!check_userpass())
                return;
            
            this._private.app.attemptLogin(document.getElementById('username').value.replace(/^\s+|\s+$/g,''),document.getElementById('password').value.replace(/^\s+|\s+$/g,''),(res)=>{
                if (res)
                    openMenu();
                else
                    alert('Login failed');
            });
        });

        bindTap(document.getElementById('btn_register'),()=>{
            if (!check_userpass())
                return;

            this._private.app.attemptRegister(document.getElementById('username').value.replace(/^\s+|\s+$/g,''),document.getElementById('password').value.replace(/^\s+|\s+$/g,''),(res)=>{
                if (res)
                    alert(res);
                else
                    openMenu();
            });
        });
    }

    static openMenu(){
        openMenu();
    }

    static openLogin(){
        openLogin();
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

    wasPressed(action,clear=true,interval=200) {
        const p = this._private;

        if (!p.actionsPressed[action] || p.actionsPressed[action]<(new Date()).getTime()-interval)
            return false;

        if (clear)
            p.actionsPressed[action] = 0;
        return true;
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

        for (let k in KEYS) {
            if (KEYS[k] && DEFINABLE_ACTIONS.has(KEYS[k])) {
                if (!actions[KEYS[k]])
                    actions[KEYS[k]] = 0;
                if (p.keyStates[k])
                    actions[KEYS[k]] = 1;
            }
        }

        for (let a in actions)
            p.actionsPressed[a] = actions[a]&&!p.lastActions[a] ? (new Date()).getTime() : p.actionsPressed[a];
        p.lastActions = {...actions};

        return actions;
    }

    get isVR() {
        return this._private.isVR
    }
}