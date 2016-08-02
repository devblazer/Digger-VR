import Subscription from './../Subscription.js';

const BLOCK_SIZE = 8;
const DEFAULT_VAL = false;

export default class Cube extends Subscription {
    constructor(size=BLOCK_SIZE,val=DEFAULT_VAL) {
        super();
        const p = this._private = {
            ...this._private,
            size,
            val,
            data:[]
        };
        for (let x=0;x<size;x++) {
            p.data[x] = [];
            for (let y = 0; y < size; y++)
                p.data[x][y] = [];
        }
        this.reset();
    }

    reset(){
        const p = this._private;
        this.fill(0,0,0,p.val,p.size,p.size,p.size);
    }

    fill(xs,ys,zs,val,xl=1,yl=1,zl=1) {
        const p = this._private;
        if (typeof val == 'undefined')
            val = p.val;

        for (let x=xs;x<xs+xl;x++)
            for (let y=ys;y<ys+yl;y++) {
                for (let z=zs;z<zs+zl;z++)
                    p.data[x][y][z] = val;
            }

        this.trigger('dataChanged');
    }

    set(x,y,z,val){
        this._private.data[x][y][z] = val;
        this.trigger('dataChanged');
    }

    get(x,y,z) {
        return this._private.data[x][y][z];
    }

    export(){
        return this._private.data;
    }
}