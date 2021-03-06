import Orientation from './Orientation.js';
import Util from './../Util.js';
import State from './../State.js';
import BlockData from './../data/BlockData.js';
import Item from './Item.js';
import Inventory from './Inventory.js';
var glm = require('gl-matrix');

export default class Control {
    constructor(gameState,map,camera,cameraFace,cameraUp,input,sound,inventory){
        const p = this._private = {
            orientation:new Orientation(),
            gameState,
            map,
            lastDig:0,
            continuousDigging:false,
            wasDigging:false,
            yVelocity:0,
            canJump:false,
            camera,
            cameraFace,
            cameraUp,
            cameraForward:[0,0,0],
            cameraRight:[0,0,0],
            input,
            sound,
            inventory,
            planarSource:null
        };
        this.normalizeCameraVectors();
    }

    getCamera(){
        const p = this._private;

        return [p.camera,p.cameraFace,p.cameraUp,p.cameraRight,p.orientation.enabled];
    }

    step(delta){
        const p = this._private;

        const actions = p.input.getAllActions(delta);
        let pos = this.processControls(delta,actions);

        this.handleMovement(pos[0],pos[1]);
        this.handleDigging(actions);
        this.handleInventory(actions);
    }

    processControls(delta,actions){
        const p = this._private;

        if (actions.rotateY)
            glm.vec3.rotateY(p.cameraFace, p.cameraFace, glm.vec3.fromValues(0, 0, 0), Util.deg2Rad(-actions.rotateY) / 3);
        if (actions.rotateX) {
            if ((p.cameraFace[1] > -0.99 || actions.rotateX < 0) && (p.cameraFace[1] < 0.99 || actions.rotateX > 0)) {
                let q = glm.quat.create();
                let r = glm.vec3.create();
                glm.vec3.cross(r, p.cameraFace, p.cameraUp);
                glm.quat.setAxisAngle(q, r, -actions.rotateX / 60);
                glm.vec3.transformQuat(p.cameraFace, p.cameraFace, q);
                glm.vec3.normalize(p.cameraFace, p.cameraFace);
            }
        }

        glm.vec3.cross(p.cameraRight, p.cameraFace, p.cameraUp);
        p.cameraRight[1] = 0;
        glm.vec3.normalize(p.cameraRight, p.cameraRight);
        glm.vec3.cross(p.cameraForward, p.cameraRight, p.cameraUp);

        p.orientation.update(p.cameraFace);

        glm.vec3.cross(p.cameraRight, p.cameraFace, p.cameraUp);
        p.cameraRight[1] = 0;
        glm.vec3.normalize(p.cameraRight, p.cameraRight);
        glm.vec3.cross(p.cameraForward, p.cameraRight, p.cameraUp);

        //if (gravityStarted)
        p.yVelocity = Math.max(-p.gameState.get('MAX_FALL_SPEED'), p.yVelocity - p.gameState.get('GRAVITY'));

        let posOld = new glm.vec3.fromValues(0,0,0);
        glm.vec3.copy(posOld,p.camera);
        let posNew = new glm.vec3.fromValues(0,0,0);
        glm.vec3.copy(posNew,p.camera);

        const MOVE_SPEED = p.gameState.get('MOVE_SPEED');

        let t;
        t = glm.vec3.create();
        glm.vec3.scale(t, p.cameraRight, actions.moveX*MOVE_SPEED);
        glm.vec3.add(posNew, posNew, t);

        if (p.canJump && actions.moveY > 0) {
            p.sound.play('jump');
            p.yVelocity += p.gameState.get('JUMP_VELOCITY');
            p.canJump = false;
        }

        t = glm.vec3.create();
        glm.vec3.scale(t, p.cameraUp, p.yVelocity*delta);
        glm.vec3.add(posNew, posNew, t);

        t = glm.vec3.create();
        glm.vec3.scale(t, p.cameraForward, actions.moveZ*MOVE_SPEED);
        glm.vec3.add(posNew, posNew, t);

        glm.vec3.cross(p.cameraRight, p.cameraFace, p.cameraUp);
        p.cameraRight[1] = 0;
        glm.vec3.normalize(p.cameraRight, p.cameraRight);
        glm.vec3.cross(p.cameraForward, p.cameraRight, p.cameraUp);

        return [posNew,posOld];
    }

    handleMovement(posNew,posOld){
        const p = this._private;
        const SELF_COL_RADIUS = p.gameState.get('SELF_COL_RADIUS');
        const SELF_COL_HEIGHT = p.gameState.get('SELF_COL_HEIGHT');
        const SELF_EYE_HEIGHT = p.gameState.get('SELF_EYE_HEIGHT');
        const MAP_SIZE = p.gameState.get('MAP_SIZE');

        var pos = {x:posNew[0],y:posNew[1],z:posNew[2]};
        var movement = {x:pos.x-posOld[0],y:p.yVelocity,z:pos.z-posOld[2]};

        var oldy = posOld[1];
        var oldz = posOld[2];
        // check X+
        if (movement.x>0) {
            var minorX = 1000000;
            var x = Math.floor(pos.x + SELF_COL_RADIUS);
            for (var y = Math.floor(oldy-SELF_EYE_HEIGHT); y <= Math.floor(oldy-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                for (var z = Math.floor(oldz - SELF_COL_RADIUS); z <= Math.floor(oldz + SELF_COL_RADIUS); z++) {
                    if (z!=oldz+SELF_COL_RADIUS && p.map.get(x, y, z).type) {
                        minorX = Math.min(minorX, x);
                    }
                }
            }
            if (minorX != 1000000) {
                pos.x = minorX - SELF_COL_RADIUS;
            }
        }
        // check X-
        else if (movement.x<0) {
            var minorX = -1000000;
            var x = Math.floor(pos.x - SELF_COL_RADIUS);
            for (var y = Math.floor(oldy-SELF_EYE_HEIGHT); y <= Math.floor(oldy-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                for (var z = Math.floor(oldz - SELF_COL_RADIUS); z <= Math.floor(oldz + SELF_COL_RADIUS); z++) {
                    if (z!=oldz+SELF_COL_RADIUS&& p.map.get(x, y, z).type) {
                        minorX = Math.max(minorX, x);
                    }
                }
            }
            if (minorX != -1000000) {
                pos.x = minorX + 1 + SELF_COL_RADIUS;
            }
        }
        // check Z+
        if (movement.z>0) {
            var minorZ = 1000000;
            var z = Math.floor(pos.z + SELF_COL_RADIUS);
            for (var y = Math.floor(oldy-SELF_EYE_HEIGHT); y <= Math.floor(oldy-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                for (var x = Math.floor(pos.x - SELF_COL_RADIUS); x <= Math.floor(pos.x + SELF_COL_RADIUS); x++) {
                    if (x!=pos.x+SELF_COL_RADIUS && p.map.get(x, y, z).type) {
                        minorZ = Math.min(minorZ, z);
                    }
                }
            }
            if (minorZ != 1000000) {
                pos.z = minorZ - SELF_COL_RADIUS;
            }
        }
        // check Z-
        else if (movement.z<0) {
            var minorZ = -1000000;
            var z = Math.floor(pos.z - SELF_COL_RADIUS);
            for (var y = Math.floor(oldy-SELF_EYE_HEIGHT); y <= Math.floor(oldy-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                for (var x = Math.floor(pos.x - SELF_COL_RADIUS); x <= Math.floor(pos.x + SELF_COL_RADIUS); x++) {
                    if (x!=pos.x+SELF_COL_RADIUS && p.map.get(x, y, z).type) {
                        minorZ = Math.max(minorZ, z);
                    }
                }
            }
            if (minorZ != -1000000) {
                pos.z = minorZ + 1 + SELF_COL_RADIUS;
            }
        }
        // check bottom
        if (movement.y<=0) {
            var highestY = 0;
            //gravityStarted = true;
            for (var x = Math.floor(pos.x - SELF_COL_RADIUS); x <= Math.floor(pos.x + SELF_COL_RADIUS); x++) {
                if (x!=pos.x+SELF_COL_RADIUS) {
                    for (var y = Math.floor(pos.y - SELF_EYE_HEIGHT); y <= Math.floor(pos.y - SELF_EYE_HEIGHT+1); y++) {
                        for (var z = Math.floor(pos.z - SELF_COL_RADIUS); z <= Math.floor(pos.z + SELF_COL_RADIUS); z++) {
                            if (z!=pos.z+SELF_COL_RADIUS && p.map.get(x, y, z).type) {
                                highestY = Math.max(highestY, y);
                                //gravityStarted = false;
                            }
                        }
                    }
                }
            }
            if (highestY != 0){//} && Math.floor(highestY + SELF_EYE_HEIGHT+1) - pos.y < 1) {
                pos.y = Math.floor(highestY + SELF_EYE_HEIGHT+1);
                p.canJump = true;
                if (p.yVelocity < -8)
                    p.sound.play('land',Math.min(1,-p.yVelocity/25));
                p.yVelocity = 0;
            }
        }
        // check top
        else if (movement.y>0) {
            var lowestY = 1000000;
            for (var x = Math.floor(pos.x - SELF_COL_RADIUS); x <= Math.floor(pos.x + SELF_COL_RADIUS); x++) {
                if (x!=pos.x+SELF_COL_RADIUS) {
                    for (var y = Math.floor(pos.y); y <= Math.floor(pos.y-SELF_EYE_HEIGHT+SELF_COL_HEIGHT); y++) {
                        for (var z = Math.floor(pos.z - SELF_COL_RADIUS); z <= Math.floor(pos.z + SELF_COL_RADIUS); z++) {
                            if (z!=pos.z+SELF_COL_RADIUS && p.map.get(x, y, z).type) {
                                lowestY = Math.min(lowestY, y);
                            }
                        }
                    }
                }
            }
            if (lowestY != 1000000) {
                pos.y = lowestY - SELF_COL_HEIGHT + SELF_EYE_HEIGHT;
                p.yVelocity = movement.y/-2;
            }
        }
        if (pos.y<=1+SELF_EYE_HEIGHT) {
            pos.y = 1 + SELF_EYE_HEIGHT;
            p.canJump = true;
            p.yVelocity = 0;
        }

        // check step
        if (!p.yVelocity) {
            var hasBottom = false;
            var y = Math.floor(pos.y - SELF_EYE_HEIGHT + 0.00001);
            for (var x = Math.floor(pos.x - SELF_COL_RADIUS - 0.00001); x <= Math.floor(pos.x + SELF_COL_RADIUS + 0.00001); x++) {
                for (var z = Math.floor(pos.z - SELF_COL_RADIUS - 0.00001); z <= Math.floor(pos.z + SELF_COL_RADIUS + 0.00001); z++) {
                    if (p.map.get(x, y, z).type) {
                        hasBottom = {x:x,z:z};
                    }
                }
            }
            var hasTop = false;
            for (var x = Math.floor(pos.x- SELF_COL_RADIUS - 0.00001); x <= Math.floor(pos.x + SELF_COL_RADIUS + 0.00001); x++) {
                for (var y = Math.floor(pos.y - SELF_EYE_HEIGHT+1); y <= Math.floor(pos.y - SELF_EYE_HEIGHT+1+SELF_COL_HEIGHT); y++) {
                    for (var z = Math.floor(pos.z- SELF_COL_RADIUS - 0.00001); z <= Math.floor(pos.z + SELF_COL_RADIUS + 0.00001); z++) {
                        if (p.map.get(x, y, z).type) {
                            hasTop = true;
                        }
                    }
                }
            }
            if (hasBottom && !hasTop) {
                pos.y += 1;
                var xdiff = Math.abs(pos.x-(hasBottom.x+0.5));
                var zdiff = Math.abs(pos.z-(hasBottom.z+0.5));
                if (xdiff>zdiff) {
                    pos.x += (Math.sign((hasBottom.x + 0.5) + pos.x) / 50000);
                }
                else {
                    pos.z += (Math.sign((hasBottom.z + 0.5) + pos.z) / 50000);
                }
            }
        }
        pos.x = Math.max(pos.x, SELF_COL_RADIUS);
        pos.z = Math.max(pos.z, SELF_COL_RADIUS);
        pos.x = Math.min(pos.x, MAP_SIZE-SELF_COL_RADIUS);
        pos.z = Math.min(pos.z, MAP_SIZE-SELF_COL_RADIUS);

        if (p.canJump && (p.camera[0]!=pos.x || p.camera[2]!=pos.z)) {
            p.sound.play('walk');
        }
        else {
            p.sound.stop('walk');
        }

        p.camera[0] = pos.x;
        p.camera[1] = pos.y;
        p.camera[2] = pos.z;
    }

    handleDigging(actions){
        const p = this._private;
        const DIG_RATE = p.gameState.get('DIG_RATE');
        const MASS_DIG_FACES = p.gameState.get('MASS_DIG_FACES');

        if (actions.dig) {
            if (!p.wasDigging) {
                p.wasDigging = true;
                p.lastDig = Math.max(p.lastDig,(new Date()).getTime()-(DIG_RATE*1000));
            }
            let digDirection = false;

            while ((new Date()).getTime() - p.lastDig >= (DIG_RATE*1000)) {
                p.lastDig += (DIG_RATE*1000);
                let res = [];

                if (!p.continuousDigging)
                    res.push(p.map.findIntersect(p.camera,p.cameraFace,4));
                else {
                    if (!digDirection) {
                        let largestInd = false;
                        let largestDist = 0;
                        p.cameraFace.forEach((dist,ind)=>{
                            if (dist * Math.sign(dist) * (ind==1?0.5:1) > largestDist) {
                                largestDist = dist * Math.sign(dist) * (ind==1?0.5:1);
                                largestInd = ind;
                            }
                        });
                        digDirection = MASS_DIG_FACES[largestInd + (p.cameraFace[largestInd]>=0?3:0)];
                    }
                    for (let x=digDirection[0][0]; x<=digDirection[1][0]+0.0001; x+=Math.max(0.1,(digDirection[1][0]-digDirection[0][0])/2))
                        for (let y=digDirection[0][1]; y<=digDirection[1][1]+0.0001; y+=Math.max(0.1,(digDirection[1][1]-digDirection[0][1])/3)) {
                            for (let z=digDirection[0][2]; z<=digDirection[1][2]+0.0001; z+=Math.max(0.1,(digDirection[1][2]-digDirection[0][2])/2)) {
                                res.push(p.map.findIntersect([p.camera[0] + x, p.camera[1] + y, p.camera[2] + z], p.cameraFace, 4));
                            }
                        }
                }

                if (res) {
                    let closestPoint = false;
                    let closestDist = 1000000;
                    res.forEach((point,ind)=>{
                        if (point) {
                            let dist = Util.distance(p.camera[0],p.camera[1],p.camera[2],point[0],point[1],point[2]);
                            if (dist < closestDist) {
                                closestDist = dist;
                                closestPoint = res[ind];
                            }
                        }
                    });
                    if (closestPoint) {
                        let block = p.map.get(closestPoint[0], closestPoint[1], closestPoint[2]);
                        if (block && block.type && block.type != 4) {
                            block.strength -= 1 / BlockData[block.type].strength;
                            if (block.strength <= 0) {
                                p.sound.play('crumble');
                                if (BlockData[block.type].createsItem)
                                    p.inventory.equip(new Item(BlockData[block.type].createsItem));

                                p.map.set(closestPoint[0], closestPoint[1], closestPoint[2], false);
                                p.map.uploadPlotFor(closestPoint[0], closestPoint[1], closestPoint[2]);
                            }
                            else
                                p.sound.play('dig');
                        }
                    }
                }
                p.continuousDigging = true;
            }
        }
        else {
            p.wasDigging = false;
            p.continuousDigging = false;
        }
    }

    handleInventory(actions) {
        const p = this._private;

        if (actions.nextInv) 
            p.inventory.beltNext();
        if (actions.prevInv)
            p.inventory.beltPrev();
        if (actions.useInv)
            actions['inv'+(p.inventory.beltSelected+1)] = 1;

        if (!actions.planar) {
            p.planarSource = null;
            for (let i = 0; i < Inventory.POUCH_SLOTS_COUNT; i++)
                if (p.input.wasPressed('inv' + i) || (i==(p.inventory.beltSelected+1) && p.input.wasPressed('useInv'))) {
                    if (p.inventory.getBelt(i - 1)) {
                        let item = p.inventory.getBelt(i - 1);
                        switch (item.category) {
                            case 'placeble_block':
                                let target = p.map.findIntersect(p.camera, p.cameraFace, 4);
                                if (target)
                                    if (!this.doICollideWith(target.slice(3))) {
                                        item.qty--;
                                        if (item.qty <= 0)
                                            p.inventory.equip(null, i - 1);
                                        p.sound.play('blockPlacement');
                                        p.map.set(target[3], target[4], target[5], item.getProp('typeInd'));
                                        p.map.uploadPlotFor(target[3], target[4], target[5]);
                                    }
                                break;
                        }
                    }
                }
        }
        else {
            if (!p.planarSource) {
                let target = p.map.findIntersect(p.camera, p.cameraFace, 4);
                if (target) {
                    target[3] = target[0]==target[3] ? 1 : 0;
                    target[4] = target[1]==target[4] ? 1 : 0;
                    target[5] = target[2]==target[5] ? 1 : 0;
                    p.planarSource = target;
                }
            }
            if (p.planarSource) {
                for (let i = 0; i < Inventory.POUCH_SLOTS_COUNT; i++)
                    if (actions['inv' + i]) {
                        if (p.inventory.getBelt(i - 1)) {
                            let item = p.inventory.getBelt(i - 1);
                            switch (item.category) {
                                case 'placeble_block':
                                    let target = p.map.findPlanarIntersect(p.camera, p.cameraFace, p.planarSource, 4);
                                    if (target && !p.map.get(target[0],target[1],target[2]).type)
                                        if (!this.doICollideWith(target)) {
                                            item.qty--;
                                            if (item.qty <= 0)
                                                p.inventory.equip(null, i - 1);
                                            p.sound.play('blockPlacement');
                                            p.map.set(target[0], target[1], target[2], item.getProp('typeInd'));
                                            p.map.uploadPlotFor(target[0], target[1], target[2]);
                                        }
                                    break;
                            }
                        }
                    }
            }
        }
    }

    doICollideWith(blockPos) {
        const p = this._private;
        const SELF_COL_RADIUS = p.gameState.get('SELF_COL_RADIUS');
        const SELF_COL_HEIGHT = p.gameState.get('SELF_COL_HEIGHT');
        const SELF_EYE_HEIGHT = p.gameState.get('SELF_EYE_HEIGHT');

        return (blockPos[0] >= Math.floor(p.camera[0]-SELF_COL_RADIUS)
            && blockPos[0] < Math.floor(p.camera[0]+SELF_COL_RADIUS)
            && blockPos[1] >= Math.floor(p.camera[1]-SELF_EYE_HEIGHT)
            && blockPos[1] < Math.floor(p.camera[1]-SELF_EYE_HEIGHT+SELF_COL_HEIGHT)
            && blockPos[2] >= Math.floor(p.camera[2]-SELF_COL_RADIUS)
            && blockPos[2] < Math.floor(p.camera[2]+SELF_COL_RADIUS)
        );
    }

    normalizeCameraVectors(){
        const p = this._private;
        glm.vec3.cross(p.cameraRight, p.cameraFace, p.cameraUp);
        p.cameraRight[1] = 0;
        glm.vec3.normalize(p.cameraRight, p.cameraRight);
        glm.vec3.cross(p.cameraForward, p.cameraRight, p.cameraUp);
    }
}