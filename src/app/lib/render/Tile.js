const BASE_DATA = [
    // x-
    0, 0, 0, 0,
    0, 0, 1, 1,
    0, 1, 0, 2,
    0, 1, 0, 3,
    0, 0, 1, 4,
    0, 1, 1, 5,
    // y-
    0, 0, 0, 6,
    1, 0, 0, 7,
    0, 0, 1, 8,
    0, 0, 1, 9,
    1, 0, 0, 10,
    1, 0, 1, 11,
    // z-
    1, 0, 0, 12,
    0, 0, 0, 13,
    1, 1, 0, 14,
    1, 1, 0, 15,
    0, 0, 0, 16,
    0, 1, 0, 17,
    // x+
    1, 0, 1, 18,
    1, 0, 0, 19,
    1, 1, 1, 20,
    1, 1, 1, 21,
    1, 0, 0, 22,
    1, 1, 0, 23,
    // y+
    1, 1, 0, 24,
    0, 1, 0, 25,
    1, 1, 1, 26,
    1, 1, 1, 27,
    0, 1, 0, 28,
    0, 1, 1, 29,
    // z+
    0, 0, 1, 30,
    1, 0, 1, 31,
    0, 1, 1, 32,
    0, 1, 1, 33,
    1, 0, 1, 34,
    1, 1, 1, 35
];

const POINT_SIZE = 4;
const FACE_SIZE = 24;

const FACE2SIDE = [1,2,1,1,0,1];
const TILES = ['empty','dirt','grass','stone'];
const TILE_TEX_RENDER = [
    [],
    ['dirt'],
    ['grass','grassEdge','dirt'],
    ['stone']
];
let rx = 10;
let fcnt = 0;
export default class Tile {
    static addFace(x,y,z,size,face,buffer){
//        x=rx++;
//        y=27;
//        z=3;
//        size=1;
//        face = 3;
        const offset = face*FACE_SIZE;

        //for (let n=0;n<6;n++) {
            fcnt+=5;
        //let n = 1;
            buffer.push(x);
            buffer.push(y);
            buffer.push(z);
            buffer.push(face);
            buffer.push(size);
/*        buffer.push((BASE_DATA[offset + (POINT_SIZE * n)] * size) + x);
        buffer.push((BASE_DATA[offset + (POINT_SIZE * n) + 1] * size) + y);
        buffer.push((BASE_DATA[offset + (POINT_SIZE * n) + 2] * size) + z);
        buffer.push(BASE_DATA[offset + (POINT_SIZE * n) + 3]);
        buffer.push(size);*/
        //}
    }

    static getSide(face){
        return FACE2SIDE[face];
    }

    static getTileName(index){
        return TILES[index];
    }
    static getTileIndex(name){
        return TILES.indexOf(name);
    }

    static getTileTexForSide(ind,side){
        return TILE_TEX_RENDER[ind][TILE_TEX_RENDER[ind].length>side?side:0];
    }
    static getTileTexTop(ind){
        return TILE_TEX_RENDER[ind][0];
    }
    static getTileTexEdge(ind){
        return TILE_TEX_RENDER[ind][TILE_TEX_RENDER[ind].length>1?1:0];
    }
    static getTileTexBottom(ind){
        return TILE_TEX_RENDER[ind][TILE_TEX_RENDER[ind].length>2?2:0];
    }

    static getCount(){
        let a = fcnt;
        fcnt = 0;
        return a;
    }
};