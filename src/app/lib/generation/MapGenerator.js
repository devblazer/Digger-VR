import Util from './../Util.js';

const TILE_INDEX_IMPENETRABLE = 4;
const TILE_INDEX_STONE = 3;
const TILE_INDEX_GRASS = 2;
const TILE_INDEX_DIRT = 1;
const TILE_INDEX_EMPTY = false;

if (!Math.cbrt)
    Math.cbrt = function(num,norounding) {
        var ret = Math.pow(num,1/3);
        return norounding?Math.round(ret):ret;
    };

export default class MapGenerator {
    constructor(map){
        this._private = {
            map,
            size:map.getSize()
        };
    }

    autoGenerate(skyRows=8){
        const p = this._private;
        const startTime = (new Date()).getTime();

        let tunnels = 0;
        switch (p.size) {
            case 64:
                skyRows = 12;
                tunnels = 6;
                break;
            case 128:
                skyRows = 24;
                tunnels = 48;
                break;
            case 256:
                skyRows = 48;
                tunnels = 385;
                break;
            case 512:
                skyRows = 96;
                tunnels = 3000;
                break;
            default:
                throw new Error('invalid map size, should be one of: 64, 128, 256, 512');
        }

        this.continent(skyRows);
        this.minerals(skyRows);
//        p.map.fill(0,p.size-8-1,0,TILE_INDEX_GRASS,p.size,1,p.size);

        let lastP = -1;

        for (let n=0;n<tunnels;n++) {
            let newP = Math.floor(n/tunnels*100);
            if (newP != lastP)
                console.log('Gen Cave: '+newP+'%');
            lastP = newP;
            let tunnelTile = TILE_INDEX_EMPTY;
            this.tunnelNetwork(null,skyRows+2,null,0,tunnelTile);
            for (let m=0;m<3;m++)
                this.tunnelNetwork(null,skyRows+2,null,Math.floor(Math.random()*5)+1,tunnelTile);
            for (let m=0;m<10;m++)
                this.tunnelNetwork(null,skyRows+2,null,Math.floor(Math.random()*2)+1,tunnelTile);
        }

        this.addFloor();

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
                                let val = p.map.get(ix,iy,iz).type;
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
                    if (z==(p.size/8)-1)
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

        p.map.fill(0,p.size-skyRows,0,TILE_INDEX_EMPTY,p.size,skyRows,p.size);
        p.map.fill(0,p.size-skyRows-1,0,TILE_INDEX_GRASS,p.size,1,p.size);
        p.map.fill(0,0,0,TILE_INDEX_DIRT,p.size,p.size-skyRows-1,p.size);
    }

    addFloor(){
        const p = this._private;

        p.map.fill(0,0,0,TILE_INDEX_IMPENETRABLE,p.size,1,p.size);
    }

    minerals(skyRows=8,type=3,ratio=0.4) {
        const p = this._private;
        let tiles = (Math.pow(p.size,3)-(Math.pow(p.size,2)*skyRows))*ratio;

        let lastCount = -1;
        let placed = 0;
        while (placed < tiles) {
            for (let n = 0; n < tiles / 10; n++) {
                let newCount = Math.floor(Math.min(placed, tiles) / tiles * 100);
                if (newCount != lastCount)
                    console.log('Minerals type ' + type + ': ' + newCount + '%');
                lastCount = newCount;
                let y = Math.floor(Math.random() * (p.size - skyRows));
                let s = (((Math.random() * 20) + 5) * (y / (p.size - skyRows)));
                placed += this.splatter(
                    Math.floor(Math.random() * (p.size + 10)) - 5,
                    p.size - (y + skyRows + 2) - 1,
                    Math.floor(Math.random() * (p.size + 10)) - 5,
                    (s / 6) + 0.7,
                    (s / 4) + 1,
                    type
                );
            }
        }
    }

    sphere(x,y,z,r,val,callback=()=>{return true;}){
        const p = this._private;
        let placed = 0;
        for (let sx=Math.max(0,Math.round(x+0.5-r)); sx<=Math.min(p.size-1,Math.round(x+0.5+r)); sx++) {
            for (let sy=Math.max(0,Math.round(y+0.5-r)); sy<=Math.min(p.size-1,Math.round(y+0.5+r)); sy++)
                for (let sz=Math.max(0,Math.round(z+0.5-r)); sz<=Math.min(p.size-1,Math.round(z+0.5+r)); sz++) {
                    if (callback(sx,sy,sz) && Math.sqrt(Math.pow(sx-x,2)+Math.pow(sy-y,2)+Math.pow(sz-z,2))<=r) {
                        if (p.map.get(sx,sy,sz).type != val)
                            placed++;
                        p.map.set(sx, sy, sz, val);
                    }
                }
        }
        return placed;
    }

    splatter(x,y,z,r,spots,val,callback=()=>{return true;}){
        let tiles = Math.pow(r*2,3)/2;
        let spotR = Math.cbrt(tiles/spots*2)/3;
        let placed = 0;

        for (let c=0;c<spots*2;c++){
            let v = Util.randomVector3();
            let d = Math.sin(Util.deg2Rad(Math.random()*90));
            placed += this.sphere(x+(v[0]*d),y+(v[1]*d),z+(v[2]*d),((Math.random()*1.5)+0.5)*spotR,val,callback);
        }
        return placed;
    }

    inBounds(x,y,z){
        const p = this._private;
        return (x>=0&&x<p.size && y>=0&&y<p.size && z>=0&&z<p.size);
    }

    tunnelNetwork(x=null,y=10,z=null,tunnelCount=0,val=TILE_INDEX_EMPTY) {
        const p = this._private;

        tunnelCount = tunnelCount || (Math.random()*15)+2;
        y = x===null&&z===null?(Math.random()*(p.size-y)):y;
        x = x===null?(Math.random()*p.size):x;
        z = z===null?(Math.random()*p.size):z;

        const activeTunnels = [[x,y,z]];
        for (let c=0;c<tunnelCount;c++) {
            c--;
            let i = Math.floor(Math.random()*activeTunnels.length);
            let sv = activeTunnels.splice(i,1)[0];
            let nvs = this.tunnelBranch(sv[0],sv[1],sv[2]);
            nvs.forEach(tunnel=>{
                c++;
                activeTunnels.push(this.tunnel(tunnel[0],tunnel[1],tunnel[2],0,0,val));
            });
        }
    }

    tunnelBranch(x,y,z,branches=0,branchFactor=30){
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

    tunnel(x,y,z,r=0,l=0,val=TILE_INDEX_EMPTY){
        r = r || (Math.random()*3.5)+0.6;
        l = l || (Math.random()*20)+5;
        const u = l/r*3;
        const v = Util.randomVector3();
        v[1] *= Math.random();

        for (let n=0;n<u;n++){
            let d = l/u*n;
            this.splatter(x+(v[0]*d),y+(v[1]*d),z+(v[2]*d),r,3,val);
        }

        return [x+(v[0]*l),y+(v[1]*l),z+(v[2]*l)];
    }
}