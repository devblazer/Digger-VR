import Sector from './Sector.js';
import Plot from './Plot.js';

const SECTOR_CACHE_LIMIT = 25;

export default class Map {
    constructor(size=64) {
        size -= size%8;
        this._private = {
            size,
            sectors:[],
            plots:[],
            sectorCache:[]
        };
        this.autoSave = true;

        this.init();
    }

    getSector(x,y,z){
        const p = this._private;

        x = Math.floor(x/8);
        y = Math.floor(y/8);
        z = Math.floor(z/8);
        const str = x+'_'+y+'_'+z;

        if (!p.sectors[str])
            this.loadSector(x,y,z);
        else
            p.sectorCache.filter(cache=>{return cache.hash==str})[0].modified = (new Date()).getTime();
        return p.sectors[str];
    }
    loadSector(x,y,z){
        const p = this._private;
        const str = x+'_'+y+'_'+z;

        const sector = new Sector();
        sector.load(p.plots[x][y][z],x==3&&y==3&&z==1);
        p.sectors[str] = sector;
        if (p.sectorCache.length == SECTOR_CACHE_LIMIT) {
            p.sectorCache.sort((a,b)=>{
                return a.modified < b.modified;
            });
            if (this.autoSave) {
                let sec = p.sectorCache[0];
                p.sectors[sec.hash].save(p.plots[sec.x][sec.y][sec.z]);
            }
            delete(p.sectors[p.sectorCache[0].hash]);
            p.sectorCache.shift();
        }
        p.sectorCache.push({hash:str,x,y,z,modified:(new Date()).getTime()});
    }

    get(x,y,z){
        return this.getSector(x,y,z).get(x%8,y%8,z%8);
    }
    set(x,y,z,val){
        this.getSector(x,y,z).set(x%8,y%8,z%8,val);
    }
    fill(x,y,z,val,xl,yl,zl){
        for (let px=Math.floor(x/8);px<=Math.floor((x+xl-1)/8);px++) {
            for (let py=Math.floor(y/8);py<=Math.floor((y+yl-1)/8);py++)
                for (let pz=Math.floor(z/8);pz<=Math.floor((z+zl-1)/8);pz++) {
                    let sx = px==Math.floor(x/8) ? (x%8) : 0;
                    let ex = px==Math.floor((x+xl-1)/8) ? (((x+xl-1)%8)+1) : (8-sx);
                    let sy = py==Math.floor(y/8) ? (y%8) : 0;
                    let ey = py==Math.floor((y+yl-1)/8) ? (((y+yl-1)%8)+1) : (8-sy);
                    let sz = pz==Math.floor(z/8) ? (z%8) : 0;
                    let ez = pz==Math.floor((z+zl-1)/8) ? (((z+zl-1)%8)+1) : (8-sz);
                    this.getSector(px*8,py*8,pz*8).fill(sx,sy,sz,val,ex,ey,ez);
                }
        }
    }

    init() {
        const p = this._private;

        for (let x = 0; x < p.size / 8; x++) {
            p.plots[x] = [];
            for (let y = 0; y < p.size / 8; y++) {
                p.plots[x][y] = [];
                for (let z = 0; z < p.size / 8; z++)
                    p.plots[x][y][z] = new Plot();
            }
        }
    }

    getSize(){
        return this._private.size;
    }

    getMemoryUsage(){
        let c = 0;
        this._private.plots.forEach(px=> {
            px.forEach(py=> {
                py.forEach(plot=> {
                    c += plot.getSize();
                });
            });
        });
        return c;
    }

    exportSector(x,y,z){
        return this.getSector(x*8,y*8,z*8);
    }
}