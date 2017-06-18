import Cube from './Cube.js';
import Plot from './Plot.js';
import Tile from './../render/Tile.js';

const CHECK_FACE = [
    [-1,0,0,0, 0,0,0,1, 0,0,0,1],
    [0,0,0,1, -1,0,0,0, 0,0,0,1],
    [0,0,0,1, 0,0,0,1, -1,0,0,0],
    [0,1,1,1, 0,0,0,1, 0,0,0,1],
    [0,0,0,1, 0,1,1,1, 0,0,0,1],
    [0,0,0,1, 0,0,0,1, 0,1,1,1]
];

const checkFace = (x,y,z,s,dir,map)=>{
    const f = CHECK_FACE[dir];
    let covered = true;
    let didSearch = false;

    let xs = Math.max(0,x+f[0]+(s*f[1]));
    let xe = Math.min(map.getSize(),x+f[2]+(s*f[3]));
    let ys = Math.max(0,y+f[4]+(s*f[5]));
    let ye = Math.min(map.getSize(),y+f[6]+(s*f[7]));
    let zs = Math.max(0,z+f[8]+(s*f[9]));
    let ze = Math.min(map.getSize(),z+f[10]+(s*f[11]));

    for (let tx=xs; tx<xe; tx++)
        for (let ty=ys; ty<ye; ty++) {
            for (let tz=zs; tz<ze; tz++) {
                if (Math.floor(x/8)==Math.floor(tx/8) && Math.floor(y/8)==Math.floor(ty/8) &&Math.floor(z/8)==Math.floor(tz/8)) {
                    didSearch = true;
                    covered &= map.get(tx, ty, tz).type;
                }
            }
        }
    return !covered || !didSearch;
};

export default class Sector extends Cube {
    constructor(x=0,y=0,z=0){
        super(8,false);
        const p = this._private = {
            ...this._private,
            needsOptimisation:true,
            needsRender:true,
            needsSave:false,
            optimisedData:null,
            renderData:null,
            tracker:{check:0,add:0},
            x,
            y,
            z
        };
        this.modified = 0;
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

    getForRender(map){
        const p = this._private;
        if (p.needsRender){
            p.needsRender = false;

            p.renderData = [];
            this.optimise();

            for (let type in p.optimisedData)
                if (p.optimisedData.hasOwnProperty(type)) {

                    let tiles = p.optimisedData[type];
                    tiles.forEach(tile=> {
                        for (let f = 0; f < 6; f++) {
                            let s = Tile.getSide(f);
                            let t = Tile.getTileTexForSide(type.substr(1)/1,s);

                            let size = Math.pow(2, tile[3]);
                            let res = checkFace((tile[0]*size)+p.x, (tile[1]*size)+p.y, (tile[2]*size)+p.z, size, f,map);

                            if (res) {
                                Tile.addFace((tile[0] * size) + p.x, (tile[1] * size) + p.y, (tile[2] * size) + p.z, size, f, t, p.renderData);
                            }
                        }
                    });
                }
            p.renderData = new Uint8Array(p.renderData);
        }
        return p.renderData;
    }
}