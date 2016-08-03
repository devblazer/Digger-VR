import Util from './../Util.js';

const TILE_INDEX_STONE = 3;
const TILE_INDEX_GRASS = 2;
const TILE_INDEX_DIRT = 1;
const TILE_INDEX_EMPTY = false;

export default class MapGenerator {
    constructor(map){
        this._private = {
            map,
            size:map.getSize()
        };
    }

    autoGenerate(skyrows=8){
        const p = this._private;
        const startTime = (new Date()).getTime();

        this.continent(skyrows);
        this.minerals(skyrows);

        let tunnels;
        if (p.size<64)
            tunnels = 1;
        else if (p.size<128)
            tunnels = 2;
        else if (p.size<256)
            tunnels = 25;
        else if (p.size<512)
            tunnels = 400;
        else
            tunnels = 5000;

        let lastP = -1;

        for (let n=0;n<tunnels;n++) {
            let newP = Math.floor(n/tunnels*100);
            if (newP != lastP)
                console.log('Gen Cave: '+newP+'%');
            lastP = newP;
            this.tunnelNetwork(null,null,skyrows+2);
        }
        const buildTime = ((new Date()).getTime()-startTime)/1000;
        const ret = this.report();
        console.log('finished build in '+(Math.floor(buildTime/60)?Math.floor(buildTime/60):'0')+':'+(buildTime%60<10?'0':'')+Math.floor(buildTime%60));
        return ret;
    }

    report(){
        const p = this._private;
        let sky = 0;
        let surface = 0;
        let dirt = 0;
        let stone = 0;
        let cave = 0;
        let lastCount = -1;

        for (let x=0;x<p.size/8;x++){
            for (let y=0;y<p.size/8;y++){
                let newCount = Math.floor(((x*(p.size/8))+y)/(p.size/8*p.size/8)*100);
                if (newCount != lastCount)
                    console.log('Counting: '+newCount+'%');
                lastCount = newCount;
                for (let z=0;z<p.size/8;z++){
                    let notEmptyTiles=0;
                    for (let ix=x*8;ix<(x+1)*8;ix++){
                        for (let iy=y*8;iy<(y+1)*8;iy++){
                            for (let iz=z*8;iz<(z+1)*8;iz++){
                                let val = p.map.get(ix,iy,iz);
                                if (val==TILE_INDEX_DIRT)
                                    dirt++;
                                else if (val==TILE_INDEX_GRASS)
                                    surface++;
                                else if (val==TILE_INDEX_STONE)
                                    stone++;
                                if (val!==TILE_INDEX_EMPTY)
                                    notEmptyTiles++;
                            }
                        }
                    }
                    if (z==p.size-1)
                        sky += (8 * 8 * 8) - notEmptyTiles;
                    else
                        cave += (8 * 8 * 8) - notEmptyTiles;
                }
            }
        }
        return {sky,surface,dirt,stone,cave,stoneRatio:Math.floor(stone/(stone+dirt+surface)*100)+'%',caveRatio:Math.floor(cave/(stone+dirt+surface+cave)*100)+'%'};
    }

    continent(skyRows=8){
        const p = this._private;

        p.map.fill(0,0,p.size-skyrows,TILE_INDEX_EMPTY,p.size,p.size,skyRows);
        p.map.fill(0,0,p.size-skyRows-1,TILE_INDEX_GRASS,p.size,p.size,1);
        p.map.fill(0,0,0,TILE_INDEX_DIRT,p.size,p.size,p.size-skyRows-1);
    }

    minerals(skyrows=8,type=3,ratio=0.5) {
        const p = this._private;
        let tiles = Math.pow(p.size,3)*ratio;

        let lastCount = -1;
        for (let n=0;n<tiles/200;n++) {
            let newCount = Math.floor(n/(tiles/200)*100);
            if (newCount != lastCount)
                console.log('Minerals type '+type+': '+newCount+'%');
            lastCount = newCount;
            let z = Math.floor(Math.random() * (p.size - skyrows-2));
            let s = ((Math.random() * 6) + 2) * (z / (p.size) * skyrows);
            this.splatter(Math.floor(Math.random() * p.size), Math.floor(Math.random() * p.size), p.size-(z + skyrows+2)-1, s/8,s/6,type);
        }
    }

    sphere(x,y,z,r,val){
        const p = this._private;
        for (let sx=Math.max(0,Math.round(x+0.5-r)); sx<=Math.min(p.size-1,Math.round(x+0.5+r)); sx++) {
            for (let sy=Math.max(0,Math.round(y+0.5-r)); sy<=Math.min(p.size-1,Math.round(y+0.5+r)); sy++)
                for (let sz=Math.max(0,Math.round(z+0.5-r)); sz<=Math.min(p.size-1,Math.round(z+0.5+r)); sz++) {
                    if (Math.sqrt(Math.pow(sx-x,2)+Math.pow(sy-y,2)+Math.pow(sz-z,2))<=r)
                        p.map.set(sx, sy, sz, val);
                }
        }
    }

    splatter(x,y,z,r,spots,val){
        let tiles = Math.pow(r*2,3)/2;
        let spotR = Math.cbrt(tiles/spots*2)/2;

        for (let c=0;c<spots*2;c++){
            let v = Util.randomVector3();
            let d = Math.sin(Util.deg2Rad(Math.random()*90));
            this.sphere(x+(v[0]*d),y+(v[1]*d),z+(v[2]*d),((Math.random()*1.5)+0.5)*spotR,val);
        }
    }

    inBounds(x,y,z){
        const p = this._private;
        return (x>=0&&x<p.size && y>=0&&y<p.size && z>=0&&z<p.size);
    }

    tunnelNetwork(x=null,y=null,z=10,tunnelCount=0) {
        const p = this._private;

        tunnelCount = tunnelCount || (Math.random()*40)+5;
        x = x===null?(Math.random()*p.size):x;
        y = y===null?(Math.random()*p.size):y;
        z = x===null&&y===null?(64-(Math.random()*(p.size-z))-z):z;

        const activeTunnels = [[x,y,z]];
        for (let c=0;c<tunnelCount;c++) {
            c--;
            let i = Math.floor(Math.random()*activeTunnels.length);
            let sv = activeTunnels.splice(i,1)[0];
            let nvs = this.tunnelBranch(sv[0],sv[1],sv[2]);
            nvs.forEach(tunnel=>{
                c++;
                activeTunnels.push(this.tunnel(tunnel[0],tunnel[1],tunnel[2]));
            });
        }
    }

    tunnelBranch(x,y,z,branches=0,branchFactor=3){
        if (!branches){
            branches = 1;
            while (Math.random()<=1/branchFactor)
                branches++;
        }
        const ret = [];
        for (let n=0;n<branches;n++)
            ret.push([x,y,z]);

        return ret;
    }

    tunnel(x,y,z,r=0,l=0){
        r = r || (Math.random()*6)+2;
        l = l || (Math.random()*20)+5;
        const u = l/r*2;
        const v = Util.randomVector3();

        for (let n=0;n<u;n++){
            let d = l/u*n;
            this.splatter(x+(v[0]*d),y+(v[1]*d),z+(v[2]*d),r,3,TILE_INDEX_EMPTY);
        }

        return [x+(v[0]*l),y+(v[1]*l),z+(v[2]*l)];
    }
}