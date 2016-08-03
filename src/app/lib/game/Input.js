const supportsPointerLock = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;

document.body.requestPointerLock = document.body.requestPointerLock ||
    document.body.mozRequestPointerLock ||
    document.body.webkitRequestPointerLock;

document.exitPointerLock = document.exitPointerLock ||
    document.mozExitPointerLock ||
    document.webkitExitPointerLock;

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

export default class Input {
    constructor() {
        const p = this._private = {
            pointerLocked: false,
            mouseXmoved: 0,
            mouseYmoved: 0,
            axisStates: [0, 0, 0,0,0,0] // leftright, downup, forwardback
        };
        this.allowPointerLock = true;
        this.allowKeyboard = true;
        const me = this;

        if (supportsPointerLock) {
            document.addEventListener('click', ()=> {
                if (me.allowPointerLock && document.body.requestPointerLock && !p.pointerLocked) {
                    document.body.requestPointerLock();
                }
            }, true);

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

    getAxisState(axis){
        return this.allowKeyboard?(this._private.axisStates[axis+3]-this._private.axisStates[axis]):0;
    }
}