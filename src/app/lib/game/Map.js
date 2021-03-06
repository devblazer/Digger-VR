import Sector from './Sector.js';
import Plot from './Plot.js';
import Util from './../Util.js';
import SplitBuffer from './../data/SplitBuffer.js';
var glm = require('gl-matrix');

const SECTOR_CACHE_LIMIT = Math.ceil(Math.pow(60,3)/30);

const VECTOR_DIR = [
    [-1,0,0],
    [0,-1,0],
    [0,0,-1],
    [1,0,0],
    [0,1,0],
    [0,0,1]
];

export default class Map_ {
    constructor(comms,size,setProgress) {
        size -= size%8;
        this._private = {
            size,
            buffs:{},
            renderBuff:new Uint8Array(1024*1024),
            sectors:[],
            plots:[],
            sectorCache:new Map(),
            comms,
            mapTable:null,
            setProgress
        };
        this.autoSave = true;

        this.init();
    }

    new(callback,db,name='test'){
        const p = this._private;
        const blockSpan = Math.floor(p.size/8);

        p.setProgress(0);

        p.comms.fetch('request_map',{size:p.size},fileID=>{
            p.comms.fetch('new_game',{fileID:fileID.fileID,size:p.size,gameName:name},data=>{
                console.log('Loading gameID: '+data.gameID);
                db.createTable('map_'+data.gameID,()=>{
                    let mapTable = p.mapTable = db['map_'+data.gameID];
                    let blockInd = 0;
                    let blockCount = Math.pow(p.size/8,3);

                    p.comms.fetch('download_map',null,data=>{
                        let buffer = new Uint8Array(data.d);
                        if (buffer.length) {
                            let z = data.z;//Math.floor(blockInd / (blockSpan*blockSpan));
                            let y = data.y;//Math.floor((blockInd - (z*blockSpan*blockSpan)) / blockSpan);
                            let x = data.x;//blockInd % blockSpan;
                            this.importPlot(x,y,z,buffer);
                            mapTable.save({id:x+'_'+y+'_'+z,x,y,z,data:buffer});
                        }
                        blockInd++;
                        p.setProgress(blockInd/blockCount*100);
                    },callback);
                });
            });
        });
    }

    load(gameID,db,callback) {
        const p = this._private;
        const blockSpan = Math.floor(p.size/8);

        p.setProgress(0);

        p.comms.fetch('load_game',{gameID,size:p.size},data=>{
            console.log('Loading gameID: '+gameID);

            db.createTable('map_'+gameID,()=>{
                let mapTable = p.mapTable = db['map_'+gameID];
                mapTable.read('0_0_0',res=>{
                    let localExists = !!res;

                    if (localExists) {
                        console.log('load from local');

                        p.setProgress(50);
                        mapTable.readEach(data=>{
                            this.importPlot(data.x, data.y, data.z, data.data);
                        },()=>{
                            callback();
                        });
                    }
                    else {
                        console.log('load from server');
                        let blockInd = 0;
                        let blockCount = Math.pow(p.size / 8, 3);

                        p.comms.fetch('download_map', null, data=> {
                            let buffer = new Uint8Array(data.d);
                            if (buffer.length) {
                                let z = data.z;//Math.floor(blockInd / (blockSpan*blockSpan));
                                let y = data.y;//Math.floor((blockInd - (z*blockSpan*blockSpan)) / blockSpan);
                                let x = data.x;//blockInd % blockSpan;
                                this.importPlot(x, y, z, buffer);
                                mapTable.save({id:x+'_'+y+'_'+z,x,y,z,data:buffer});
                            }
                            blockInd++;
                            p.setProgress(blockInd/blockCount*100);
                        }, callback);
                    }
                });
            });
        });
    }

    isSectorLoaded(x,y,z) {
        const p = this._private;

        x = Math.floor(x/8);
        y = Math.floor(y/8);
        z = Math.floor(z/8);
        const str = x+'_'+y+'_'+z;

        return !!p.sectors[str];
    }

    getSector(x,y,z,updateModified = false){
        const p = this._private;

        x = Math.floor(x/8);
        y = Math.floor(y/8);
        z = Math.floor(z/8);
        const str = x+'_'+y+'_'+z;

        if (!p.sectors[str])
            this.loadSector(x,y,z);
        else if (updateModified)
            p.sectorCache.get(str).modified = (new Date()).getTime();
        return p.sectors[str];
    }
    loadSector(x,y,z){
        const p = this._private;
        const str = x+'_'+y+'_'+z;

        const sector = new Sector(x*8,y*8,z*8);

        sector.load(p.plots[x][y][z]);
        p.sectors[str] = sector;
        if (p.sectorCache.size == SECTOR_CACHE_LIMIT) {
            let newMap = new Map();
            [...p.sectorCache.values()].sort((a,b)=>{
                return a.modified < b.modified;
            }).forEach(sector=>{
                newMap.set(sector.hash, sector)
            });
            p.sectorCache = newMap;
            let firstSector = p.sectorCache.values().next().value;

            if (this.autoSave)
                p.sectors[firstSector.hash].save(p.plots[firstSector.x][firstSector.y][firstSector.z]);
            delete(p.sectors[firstSector.hash]);
            p.sectorCache.delete(firstSector.hash);
        }
        p.sectorCache.set(str,{hash:str,x,y,z,modified:(new Date()).getTime()});
    }

    uploadPlotFor(x,y,z) {
        const p = this._private;
        let sx = Math.floor(x/8);
        let sy = Math.floor(y/8);
        let sz = Math.floor(z/8);
        let plot = p.plots[sx][sy][sz];
        this.getSector(x,y,z).save(plot);
        let buffer = plot.export();
        p.mapTable.save({id:sx+'_'+sy+'_'+sz,x:sx,y:sy,z:sz,data:buffer});
        p.comms.emit('update_plot',{x:sx,y:sy,z:sz,data:buffer});
    }

    findIntersect(origin,vector,limit) {
        const p = this._private;

        let pos = origin.slice();
        let nBlock = [
            Math.floor(pos[0]),
            Math.floor(pos[1]),
            Math.floor(pos[2])
        ];

        let found = null;
        let looped = 0;
        let nextAxis = -1;

        while (
            nBlock[0]>=0&&nBlock[0]<p.size
            && nBlock[1]>=0&&nBlock[1]<p.size
            && nBlock[2]>=0&&nBlock[2]<p.size
            && Math.sqrt(Math.pow(pos[0]-origin[0],2) + Math.pow(pos[1]-origin[1],2) + Math.pow(pos[2]-origin[2],2)) < limit
            && looped < limit*10
        ) {
            looped++;
            let dist = [1000000, 1000000, 1000000];
            for (let axis = 0; axis < 3; axis++) {
                let toMove = [];
                let axisDist = 1000000;

                if (vector[axis] < 0)
                    axisDist = pos[axis] - Math.floor(pos[axis]);
                else if (vector[axis] > 0)
                    axisDist = Math.ceil(pos[axis]) - pos[axis];
                axisDist = axisDist?axisDist:1;

                for (let mAxis = 0; mAxis < 3; mAxis++) {
                    if (mAxis != axis)
                        toMove.push(vector[mAxis] / vector[axis] * axisDist);
                }
                dist[axis] = Math.sqrt(Math.pow(axisDist, 2) + Math.pow(toMove[0], 2) + Math.pow(toMove[1], 2));
            }

            let smallest = 2000000;
            nextAxis = -1;
            dist.forEach((dist, axis)=> {
                if (dist < smallest) {
                    nextAxis = axis;
                    smallest = dist;
                }
            });

            let dirInd = (Math.sign(vector[nextAxis]) * 1.5) + 1.5 + nextAxis;

            for (let axis = 0; axis < 3; axis++) {
                if (axis == nextAxis)
                    pos[axis] = Math.round(pos[axis]+ vector[axis] * dist[nextAxis]);
                else
                    pos[axis] += vector[axis] * dist[nextAxis];
            }

            nBlock = [
                Math.floor(pos[0]) + VECTOR_DIR[dirInd][0] * (Math.floor(pos[0])!=pos[0] || vector[nextAxis] >= 0 ? 0 : 1),
                Math.floor(pos[1]) + VECTOR_DIR[dirInd][1] * (Math.floor(pos[1])!=pos[1] || vector[nextAxis] >= 0 ? 0 : 1),
                Math.floor(pos[2]) + VECTOR_DIR[dirInd][2] * (Math.floor(pos[2])!=pos[2] || vector[nextAxis] >= 0 ? 0 : 1),
            ];

            if (this.get(nBlock[0], nBlock[1], nBlock[2]).type) {
                found = nBlock;
                break;
            }
        }
        if (found) {
            found[3] = found[0] + (nextAxis == 0 ? Math.sign(vector[nextAxis]) * -1 : 0);
            found[4] = found[1] + (nextAxis == 1 ? Math.sign(vector[nextAxis]) * -1 : 0);
            found[5] = found[2] + (nextAxis == 2 ? Math.sign(vector[nextAxis]) * -1 : 0);
        }
        return found;
    }

    findPlanarIntersect(origin,vector,plane,limit) {
        let axis = plane.slice(3).reduce((aggr,val,ind)=>{
            return val ? aggr : ind;
        },-1);
        let axisShift = plane[axis]-origin[axis]+(vector[axis]<0?1:0);
        let diff = vector.map((v,ind)=>{
            return ind==axis ? axisShift : (axisShift / vector[axis] * v);
        });
        if (Util.distance(0,0,0,diff[0],diff[1],diff[2]) > limit)
            return null;

        let ret = diff.map((d,ind)=>{
            return (ind==axis) ? plane[axis] : Math.floor(origin[ind]+d);
        });
        vector.forEach((v,ind)=>{
            ret[ind+3] = ret[ind];
        });
        ret[axis+3] = plane[axis+3];

        return ret;
    }

    get(x,y,z){
        const p = this._private;
        if (x<0||x>=p.size || y<0||y>=p.size || z<0||z>=p.size)
            return false;

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

    getForRender(camera,cameraFace,range=22,vertexData){
        const p = this._private;

        const arrs = [];

        for (let x = Math.max(0, Math.floor((camera[0] - range) / 8)); x < Math.min(p.size / 8, Math.floor((camera[0] + range) / 8) + 1); x++) {
            for (let y = Math.max(0, Math.floor((camera[1] - range) / 8)); y < Math.min(p.size / 8, Math.floor((camera[1] + range) / 8) + 1); y++) {
                for (let z = Math.max(0, Math.floor((camera[2] - range) / 8)); z < Math.min(p.size / 8, Math.floor((camera[2] + range) / 8) + 1); z++) {
                    let dist = Math.sqrt(Math.pow(camera[0] - ((x * 8) + 4), 2) + Math.pow(camera[1] - ((y * 8) + 4), 2) + Math.pow(camera[2] - ((z * 8) + 4), 2));
                    if (dist <= range) {
                        const tvec = glm.vec3.fromValues((x * 8) + 4 - camera[0], (y * 8) + 4 - camera[1], (z * 8) + 4 - camera[2]);
                        glm.vec3.normalize(tvec, tvec);
                        let adiff = Util.rad2Deg(Math.acos(glm.vec3.dot(tvec, cameraFace)));
                        if ((dist < range - 2 && adiff < 180 - (dist * (120 / (range - 2)))) || adiff < 60) {
                            let rend = this.getSector(x * 8, y * 8, z * 8,true).getForRender(this);
                            arrs.push(rend);
                        }
                    }
                }
            }
        }

        vertexData.reset();
        arrs.forEach(u8v=> {
            vertexData.add(u8v);
        });
    }

    exportSector(x,y,z){
        return this.getSector(x*8,y*8,z*8);
    }

    exportPlot(x,y,z){
        this.getSector(x*8,y*8,z*8).save(this._private.plots[x][y][z]);
        return this._private.plots[x][y][z].export();
    }
    getPlot(x,y,z){
        this.getSector(x*8,y*8,z*8).save(this._private.plots[x][y][z]);
        return this._private.plots[x][y][z];
    }
    importPlot(x,y,z,buffer) {
        const p = this._private;

        p.plots[x][y][z].import(buffer);

        let str = x+'_'+y+'_'+z;
        let secFound = p.sectorCache.has(str)
        if (secFound) {
            secFound = p.sectorCache.get(str);
            delete(p.sectors[str]);
            p.sectorCache.delete(secFound.hash);
        }
   }

    foreachPlot(func){
        const p = this._private;
        for (let z=0;z<p.size/8;z++){
            for (let y=0;y<p.size/8;y++){
                for (let x=0;x<p.size/8;x++){
                    func(x,y,z);
                }
            }
        }
    }
}