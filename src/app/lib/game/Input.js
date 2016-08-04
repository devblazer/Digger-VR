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
    7:'up',
    6:'down',
    12:'up',
    13:'down'
};

const MOUSE_X_SPEED = 0.3;
const MOUSE_Y_SPEED = 0.3;
const KEY_MOVE_SPEED = 3;
const GAMEPAD_MOVE_SPEED = 3;
const GAMEPAD_ROTATE_SPEED = 150;

const processGamepadState = ()=>{
    const gp = navigator.getGamepads()[0];
    const actions = {moveX:0,moveY:0,moveZ:0,rotateX:0,rotateY:0,up:0,down:0,left:0,right:0,forward:0,back:0,turnLeft:0,turnRight:0,turnUp:0,turnDown:0,primary:0};

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

export default class Input {
    constructor() {
        const p = this._private = {
            pointerLocked: false,
            mouseXmoved: 0,
            mouseYmoved: 0,
            axisStates: [0, 0, 0,0,0,0] // leftright, downup, forwardback
        };
        this.allowPointerLock = true;
        this.allowFullScreen = true;
        this.allowKeyboard = true;
        this.allowGamepad = true;
        const me = this;

        if (supportsPointerLock) {
            document.body.addEventListener('click', activatePointerLock, true);
            document.body.addEventListener('touchstart', activatePointerLock, true);
            function activatePointerLock () {
                if (me.allowFullScreen)
                    document.body.requestFullscreen();
                if (me.allowPointerLock && document.body.requestPointerLock && !p.pointerLocked) {
                    document.body.requestPointerLock();
                }
            }

            const pointerLockChanged = (e)=> {
                p.pointerLocked = (document.pointerLockElement === document.body || document.mozPointerLockElement === document.body || document.webkitPointerLockElement === document.body);
            };
            document.addEventListener('pointerlockchange', pointerLockChanged, false);
            document.addEventListener('mozpointerlockchange', pointerLockChanged, false);
            document.addEventListener('webkitpointerlockchange', pointerLockChanged, false);
            document.addEventListener('mousemove', (e)=> {
                if (p.pointerLocked) {
                    p.mouseXmoved += (e.movementX || e.mozMovementX || e.webkitMovementX || 0);
                    p.mouseYmoved += (e.movementY || e.mozMovementY || e.webkitMovementY || 0);
                }
            }, false);
        }

        document.addEventListener('keydown',(e)=>{
            if (KEYS[e.which||e.keyCode]) {
                p.axisStates[KEYS2AXES[KEYS[e.which || e.keyCode]]] = 1;
                e.preventDefault();
            }
        },true);
        document.addEventListener('keyup',(e)=>{
            if (KEYS[e.which||e.keyCode]) {
                p.axisStates[KEYS2AXES[KEYS[e.which || e.keyCode]]] = 0;
                e.preventDefault();
            }
        },true);
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
        actions.moveY += (gp.down - gp.up + gp.moveY) * GAMEPAD_MOVE_SPEED * delta;
        actions.moveZ += (gp.back - gp.forward + gp.moveZ) * GAMEPAD_MOVE_SPEED * delta;
        actions.rotateY += (gp.turnRight - gp.turnLeft + (gp.rotateY*2)) * GAMEPAD_ROTATE_SPEED * delta;
        actions.rotateX += (gp.turnUp - gp.turnDown + gp.rotateX) * GAMEPAD_ROTATE_SPEED * delta;

        ['moveX','moveY','moveZ'].forEach(item=>{
            actions[item] = Math.min(1,Math.max(-1,actions[item]));
        });

        return actions;
    }
}