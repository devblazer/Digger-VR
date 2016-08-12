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

const FACE_TILE_REPLICATION = [
    [0,1,1],
    [1,0,1],
    [1,1,0],
    [0,1,1],
    [1,0,1],
    [1,1,0]
];
const FACE_TILE_ADDITION = [
    [0,0,0],
    [0,0,0],
    [0,0,0],
    [1,0,0],
    [0,1,0],
    [0,0,1]
];

const POINT_SIZE = 4;
const FACE_SIZE = 24;

const TILE_TEX_IND = ['','dirt','grassEdge','grass','stone','impenetrable'];

const FACE2SIDE = [1,2,1,1,0,1];
const TILES = ['empty','dirt','grass','stone','impenetrable'];
const TILE_TEX_RENDER = [
    [0,0,0],
    [1,1,1],
    [3,2,1],
    [4,4,4],
    [5,5,5]
];
let rx = 10;
let fcnt = 0;
export default class Tile {
    static addFace(x,y,z,size,face,type,buffer) {
//        x=rx++;
//        y=27;
//        z=3;
//        size=1;
//        face = 3;
        const offset = face * FACE_SIZE;

        for (let sx = 0; sx < Math.max(1,size * FACE_TILE_REPLICATION[face][0]); sx++) {
            for (let sy = 0; sy < Math.max(1,size * FACE_TILE_REPLICATION[face][1]); sy++) {
                for (let sz = 0; sz < Math.max(1,size * FACE_TILE_REPLICATION[face][2]); sz++) {
                    //for (let n=0;n<6;n++) {
                    fcnt += 5;
                    //let n = 1;
                    buffer.push(x + sx + FACE_TILE_ADDITION[face][0]*(size-1));
                    buffer.push(y + sy + FACE_TILE_ADDITION[face][1]*(size-1));
                    buffer.push(z + sz + FACE_TILE_ADDITION[face][2]*(size-1));
                    buffer.push(face);
                    buffer.push(type-1);
                    //}
                }
            }
        }
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