import Sector from './Sector.js';
import Plot from './Plot.js';

const SECTOR_CACHE_LIMIT = 125;

export default class Map {
    constructor(size=64) {
        size -= size%8;
        this._private = {
            size,
            buffs:{},
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

        const sector = new Sector(x*8,y*8,z*8);
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
                    let ex = px==Math.floor((x+xl-1)/8) ? (((x+xl-1)%8)+1-sx) : (8-sx);
                    let sy = py==Math.floor(y/8) ? (y%8) : 0;
                    let ey = py==Math.floor((y+yl-1)/8) ? (((y+yl-1)%8)+1-sy) : (8-sy);
                    let sz = pz==Math.floor(z/8) ? (z%8) : 0;
                    let ez = pz==Math.floor((z+zl-1)/8) ? (((z+zl-1)%8)+1-sz) : (8-sz);
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

    getForRender(camera,range=19){
        const p = this._private;

        const cnt = {};
        const arrs = {};
        const buffs = p.buffs;

        for (let x = Math.max(0,Math.floor((camera[0]-range)/8)); x < Math.min(p.size/8,Math.floor((camera[0]+range)/8)+1); x++) {
            for (let y = Math.max(0,Math.floor((camera[1]-range)/8)); y < Math.min(p.size/8,Math.floor((camera[1]+range)/8)+1); y++) {
                for (let z = Math.max(0,Math.floor((camera[2]-range)/8)); z < Math.min(p.size/8,Math.floor((camera[2]+range)/8)+1); z++) {
                    if (Math.sqrt(Math.pow(camera[0]-((x*8)+4),2) + Math.pow(camera[1]-((y*8)+4),2) + Math.pow(camera[2]-((z*8)+4),2))<=range) {
                    let rend = this.getSector(x*8,y*8,z*8).getForRender(this);
                    for (let t in rend.tiles) {
                        if (rend.tiles.hasOwnProperty(t)) {
                            if (!cnt[t]) {
                                cnt[t] = 0;
                                arrs[t] = [];
                            }
                            arrs[t].push(rend.tiles[t].faces);
                            cnt[t]+=rend.tiles[t].faces.buffer.byteLength;
                        }
                    }
                }}
            }
        }
        for (let t in cnt) {
            if (cnt.hasOwnProperty(t)) {
                if (!buffs[t])
                    buffs[t] = {buf:new Float32Array(2000000),count:cnt[t]};
                else
                    buffs[t].count = cnt[t];

                let pos = 0;
                arrs[t].forEach(u8v=>{
                    buffs[t].buf.set(u8v, pos);
                    pos+= u8v.buffer.byteLength;
                });
            }
        }

        return buffs;
    }

    exportSector(x,y,z){
        return this.getSector(x*8,y*8,z*8);
    }
}