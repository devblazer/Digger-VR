import $ from 'jquery';

const weight = function(num, exp){
    var rev = exp < 0;
    exp = exp===undefined ? 1 : Math.abs(exp)+1;
    var res = Math.pow(num, exp);
    return rev ? 1 - res : res;
};
const RAD = Math.PI/180;
const UID_CHARS = 'abcdefghijklmnopqrstuvwxyz01234567890'.split('');

var lastPerf = 0;
var perfTypes = [];
var debugReady = false;
var postLogIndex = [];
var postLogItems = [];

export default {
    randomWeighted(num, exp) {
        return Math.floor( (typeof exp=='undefined'?Math.random():weight(Math.random(), exp)) * num );
    },
    random(num) {
        return this.randomWeighted(num);
    },
    uid(l=8){
        let s='';
        for (let n=0;n<l;n++)
            s+=UID_CHARS[Math.floor(Math.random()*UID_CHARS.length)];
        return s;
    },
    hasParam(obj) {
        for (var i in obj)
            if (obj.hasOwnProperty(i)) {
                return true;
            }
        return false;
    },
    isFunction(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    },
    objDistance(obj1,obj2) {
        return Math.sqrt(Math.pow(obj2.x-obj1.x,2) + Math.pow(obj2.y-obj1.y,2));
    },
    distance(x1,y1,z1,x2,y2,z2) {
        return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2) + Math.pow(z2-z1,2));
    },
    deg2Rad(deg){
        return deg * RAD;
    },
    rad2Deg(rad){
        return rad / RAD;
    },
    angleDiff(direction1, direction2){
        direction1 -= direction2;
        direction1 *= Math.sign(direction1);
        while (direction1 > 180)
            direction1 = 360 - direction1;
        return direction1;
    },
    vector2FromRotation(distance,rotation){
        rotation = this.deg2Rad(rotation);
        return [
            Math.sin(rotation) * distance,
            Math.cos(rotation) * distance
        ];
    },
    rotationFromVector2(x,y,speed=null){
        speed = speed===null? Math.sqrt(Math.pow(x,2)+Math.pow(y,2)) : speed;
        if (!speed)
            return [0,0];
        let dir = this.rad2Deg(Math.acos(y/speed));
        if (x<0)
            dir *= -1;
        return [speed,dir];
    },
    directionToObject(pos1,pos2){
        pos2[0] -= pos1[0];
        pos2[1] -= pos1[1];
        return this.rotationFromVector2(pos2[0],pos2[1]);
    },
    perf(name=''){
        let time = (new Date()).getTime();
        if (lastPerf)
            console.log(name+': '+(time-lastPerf));
        lastPerf = time;
    },
    debugStart(){
        debugReady = true;
    },
    debugNow(items,other) {
        if (debugReady) {
            if (typeof other != 'undefined')
                console.log.apply(console, arguments);
            else
                console.log(items);
        }
    },
    debugStop(){
        debugReady = false;
    },
    isArray(val){
        return $.isArray(val);
    },
    randomVector3(){
        let s1=1,s2=1;

        while (Math.pow(s1,2)+Math.pow(s2,2)>=1) {
            s1 = (Math.random()*2)-1;
            s2 = (Math.random()*2)-1;
        }

        let x = 2*s1*Math.sqrt(1-Math.pow(s1,2)-Math.pow(s2,2));
        let y = 2*s2*Math.sqrt(1-Math.pow(s1,2)-Math.pow(s2,2));
        let z = 1-(2*(Math.pow(s1,2)+Math.pow(s2,2)));

        return [x,y,z];
    },
    postLogStart(type=null){
        if (type){
            postLogIndex = [type];
            postLogItems[type] = [];
        }
        else {
            postLogIndex = [];
            postLogItems = [];
        }
    },
    postLog(item,type='default'){
        if (!postLogItems[type])
            postLogItems[type] = [];
        postLogItems[type].push(item);
    },
    postLogOutput(type='default'){
        if(postLogItems[type])
            postLogItems[type].forEach(item=>{
                console.log(item);
            });
    }
};
