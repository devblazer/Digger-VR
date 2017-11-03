import Util from './../Util.js';

const EMPTY_VALUE = false;

export default class Plot {
    constructor(){
        this._private = {
            u8v:null
        };
    }

    readInto(sector){
        const p = this._private;

        sector.reset();
        if (p.u8v) {
            let cursor = 0;
            while (cursor<p.u8v.length) {
                let init2b = (p.u8v[cursor] << 8) + p.u8v[cursor + 1];
                let x = init2b & 7;
                init2b >>= 3;
                let y = init2b & 7;
                init2b >>= 3;
                let z = init2b & 7;
                init2b >>= 3;
                let s = Math.pow(2, init2b);
                sector.fill(x*s, y*s, z*s, p.u8v[cursor + 2], s, s, s);
                cursor += 3;
            }
        }
    }

    static optimize(tileData) {
        const newData = {};
        const parser = [[]];
        const oSize = tileData.length;

        for (let x=0;x<oSize;x++) {
            parser[0][x] = [];
            for (let y=0;y<oSize;y++) {
                parser[0][x][y] = [];
                for (let z=0;z<oSize;z++)
                    parser[0][x][y][z] = tileData[x][y][z].type;
            }
        }

        let depth = 1;
        let span = 2;
        let changed = 1;
        while (changed && span <= oSize) {
            changed = 0;
            parser[depth] = [];
            for (let x=0;x<oSize/span;x++) {
                parser[depth][x] = [];
                for (let y=0;y<oSize/span;y++) {
                    parser[depth][x][y] = [];
                    for (let z=0;z<oSize/span;z++) {
                        let pass = true;
                        let match = parser[depth-1][x*2][y*2][z*2];
                        for (let xs = x * 2; xs < (x * 2) + 2; xs++)
                            for (let ys = y * 2; ys < (y * 2) + 2; ys++) {
                                for (let zs = z * 2; zs < (z * 2) + 2; zs++)
                                    pass &= parser[depth-1][xs][ys][zs] == match !== EMPTY_VALUE;
                            }
                        if (pass) {
                            changed++;
                            parser[depth][x][y][z] = match;
                        }
                    }
                }
            }
            depth++;
            span = Math.pow(2,depth);
        }

        for (let d=0;d<parser.length;d++) {
            span = Math.pow(2,d);
            for (let x=0;x<oSize/span;x++) {
                for (let y=0;y<oSize/span;y++)
                    for (let z=0;z<oSize/span;z++) {
                        if (typeof parser[d][x][y][z] != 'undefined' && parser[d][x][y][z] !== EMPTY_VALUE)
                            if (typeof parser[d+1]=='undefined' || typeof parser[d+1][Math.floor(x / 2)][Math.floor(y / 2)][Math.floor(z / 2)] == 'undefined') {
                                if (!newData[parser[d][x][y][z]])
                                    newData[parser[d][x][y][z]] = [];
                                newData[parser[d][x][y][z]].push([x,y,z,d]);
                            }
                    }
            }
        }

        return newData;
    }

    write(optimisedData){
        if (Util.isArray(optimisedData))
            optimisedData = this.constructor.optimize(optimisedData);

        const p = this._private;
        const newData = [];

        for (let p in optimisedData)
            if (optimisedData.hasOwnProperty(p)) {
                optimisedData[p].forEach(tile=> {
                    let x = tile[0];
                    let y = tile[1];
                    let z = tile[2];
                    let d = tile[3];
                    let init2b = x + (y << 3) + (z << 6) + (d << 9);
                    newData.push(init2b >> 8);
                    newData.push(init2b & 255);
                    newData.push(p / 1);
                });
            }

        p.u8v = new Uint8Array(newData);
    }

    getSize(){
        const p = this._private;
        return p.u8v?p.u8v.length:0;
    }

    export(){
        return this._private.u8v.length?(new Buffer(this._private.u8v,'ascii')):null;
    }
    import(buffer){
        this._private.u8v = new Uint8Array(buffer);
    }
}