import Cube from './Cube.js';
import Plot from './Plot.js';
import Tile from './../render/Tile.js';

export default class Sector extends Cube {
    constructor(x=0,y=0,z=0){
        super();
        const p = this._private = {
            ...this._private,
            needsOptimisation:true,
            needsRender:true,
            optimisedData:null,
            renderData:null,
            x,
            y,
            z
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
            console.log('render')
            p.needsRender = false;

            p.renderData = {tiles:[]};
            this.optimise();

            for (let type in p.optimisedData)
                if (p.optimisedData.hasOwnProperty(type)) {

                    let tiles = p.optimisedData[type];
                    tiles.forEach(tile=> {
                        for (let f = 0; f < 6; f++) {
                            let s = Tile.getSide(f);
                            let t = Tile.getTileTexForSide(type.substr(1)/1,s);
                            if (!p.renderData.tiles[t])
                                p.renderData.tiles[t] = {type: t, faces: []};
                            let size = Math.pow(2, tile[3]);
                            Tile.addFace((tile[0]*size)+p.x, (tile[1]*size)+p.y, (tile[2]*size)+p.z, size, f, p.renderData.tiles[t].faces);
                        }
                    });
                }
            for (let type in p.renderData.tiles) {
                if (p.renderData.tiles.hasOwnProperty(type)) {
                    p.renderData.tiles[type].faces = new Float32Array(p.renderData.tiles[type].faces);
                }
            }
        }
        return p.renderData;
    }
}