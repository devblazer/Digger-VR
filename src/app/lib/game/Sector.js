import Cube from './Cube.js';
import Plot from './Plot.js';

export default class Sector extends Cube {
    constructor(){
        super();
        const p = this._private = {
            ...this._private,
            needsOptimisation:true,
            needsRender:true,
            optimisedData:null,
            renderData:null
        };
    }

    optimise(){
        const p = this._private;
        if (!p.needsOptimisation)
            return;
        p.optimisedData = Plot.optimize(p.data);
        p.needsOptimisation = false;
    }

    reset(){
        this._private.needsOptimisation = true;
        this._private.needsRender = true;
        super.reset();
    }

    fill(xs,ys,zs,val,xl=1,yl=1,zl=1) {
        this._private.needsOptimisation = true;
        this._private.needsRender = true;

        if (typeof val == 'undefined')
            val = this._private.val;
        super.fill(xs,ys,zs,val,xl,yl,zl);
    }

    set(x,y,z,val){
        this._private.needsOptimisation = true;
        this._private.needsRender = true;
        super.set(x,y,z,val);
    }

    save(plot){
        this.optimise();
        plot.write(this._private.optimisedData);
    }

    load(plot){
        this._private.needsOptimisation = true;
        this._private.needsRender = true;
        plot.readInto(this);
    }

    getForRender(){
        const p = this._private;
        if (p.needsRender){
            p.needsRender = false;

            p.renderData = new Float32Array(1);
        }
        return p.renderData;
    }
}