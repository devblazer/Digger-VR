import THREE from 'three';
import glm from 'gl-matrix';

export default class Orientation {
    constructor() {

        this.supported = window.orientation;
        if (this.supported) {
            this.enabled = true;

            this.deviceOrientation = {alpha:0,beta:0,gamma:0};
            this.screenOrientation = 0;

            // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

            this.setObjectQuaternion = function () {
                let zee = new THREE.Vector3(0, 0, 1);
                let euler = new THREE.Euler();
                let q0 = new THREE.Quaternion();
                let q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis

                return function (quaternion, alpha, beta, gamma, orient) {
                    euler.set(beta, alpha, -gamma, 'YXZ');                       // 'ZXY' for the device, but 'YXZ' for us
                    quaternion.setFromEuler(euler);                               // orient the device
                    quaternion.multiply(q1);                                      // camera looks out the back of the device, not the top
                    quaternion.multiply(q0.setFromAxisAngle(zee, -orient));    // adjust for screen orientation
                }
            }();
            const me = this;

            this.onDeviceOrientationChangeEvent = event=>{
                me.deviceOrientation = event;
            };
            this.onScreenOrientationChangeEvent = ()=>{
                me.screenOrientation = window.orientation || 0;
            };

            this.connect();
        }
    }

    connect() {
        if (this.supported) {
            this.onScreenOrientationChangeEvent(); // run once on load

            window.addEventListener('orientationchange', this.onScreenOrientationChangeEvent, false);
            window.addEventListener('deviceorientation', this.onDeviceOrientationChangeEvent, false);

            this.enabled = true;
        }
    }

    disconnect() {
        if (this.supported) {
            window.removeEventListener('orientationchange', this.onScreenOrientationChangeEvent, false);
            window.removeEventListener('deviceorientation', this.onDeviceOrientationChangeEvent, false);

            this.enabled = false;
        }
    }

    update(cameraFace) {
        if (this.supported) {
            if (this.enabled === false) return;

            var object = new THREE.Camera();
            object.rotation.reorder("YXZ");
            object.lookAt(0,0,-1);

            var alpha = this.deviceOrientation.alpha ? THREE.Math.degToRad(this.deviceOrientation.alpha) : 0; // Z
            var beta = this.deviceOrientation.beta ? THREE.Math.degToRad(this.deviceOrientation.beta) : 0; // X'
            var gamma = this.deviceOrientation.gamma ? THREE.Math.degToRad(this.deviceOrientation.gamma) : 0; // Y''
            var orient = this.screenOrientation ? THREE.Math.degToRad(this.screenOrientation) : 0; // O

            this.setObjectQuaternion(object.quaternion, alpha, beta, gamma, orient);

            var v = new THREE.Vector3(0,0,-1);
            object.getWorldDirection(v);

            cameraFace[0] = v.x;
            cameraFace[1] = v.y;
            cameraFace[2] = v.z;
        }
    }

    dispose() {
        this.disconnect();
    }
}
