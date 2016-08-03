const BASE_DATA = [
    // x-
    0, 0, 0, -1, 0, 0, 0, 0,
    0, 0, 1, -1, 0, 0, 1, 0,
    0, 1, 0, -1, 0, 0, 0, 1,
    0, 1, 0, -1, 0, 0, 0, 1,
    0, 0, 1, -1, 0, 0, 1, 0,
    0, 1, 1, -1, 0, 0, 1, 1,
    // y-
    0, 0, 0, 0, -1, 0, 0, 0,
    1, 0, 0, 0, -1, 0, 1, 0,
    0, 0, 1, 0, -1, 0, 0, 1,
    0, 0, 1, 0, -1, 0, 0, 1,
    1, 0, 0, 0, -1, 0, 1, 0,
    1, 0, 1, 0, -1, 0, 1, 1,
    // z-
    1, 0, 0, 0, 0, -1, 0, 0,
    0, 0, 0, 0, 0, -1, 1, 0,
    1, 1, 0, 0, 0, -1, 0, 1,
    1, 1, 0, 0, 0, -1, 0, 1,
    0, 0, 0, 0, 0, -1, 1, 0,
    0, 1, 0, 0, 0, -1, 1, 1,
    // x+
    1, 0, 1, 1, 0, 0, 0, 0,
    1, 0, 0, 1, 0, 0, 1, 0,
    1, 1, 1, 1, 0, 0, 0, 1,
    1, 1, 1, 1, 0, 0, 0, 1,
    1, 0, 0, 1, 0, 0, 1, 0,
    1, 1, 0, 1, 0, 0, 1, 1,
    // y+
    1, 1, 0, 0, 1, 0, 0, 0,
    0, 1, 0, 0, 1, 0, 1, 0,
    1, 1, 1, 0, 1, 0, 0, 1,
    1, 1, 1, 0, 1, 0, 0, 1,
    0, 1, 0, 0, 1, 0, 1, 0,
    0, 1, 1, 0, 1, 0, 1, 1,
    // z+
    0, 0, 1, 0, 0, 1, 0, 0,
    1, 0, 1, 0, 0, 1, 1, 0,
    0, 1, 1, 0, 0, 1, 0, 1,
    0, 1, 1, 0, 0, 1, 0, 1,
    1, 0, 1, 0, 0, 1, 1, 0,
    1, 1, 1, 0, 0, 1, 1, 1
];

const POINT_SIZE = 8;
const FACE_SIZE = 48;

const FACE2SIDE = [1,2,1,1,0,1];
const TILES = ['empty','dirt','grass','stone'];
const TILE_TEX_RENDER = [
    [],
    ['dirt'],
    ['grass','grassEdge','dirt'],
    ['stone']
];

export default class Tile {
    static addFace(x,y,z,size,face,buffer){
        const offset = face*FACE_SIZE;

        for (let n=0;n<6;n++) {
            buffer.push((BASE_DATA[offset + (POINT_SIZE * n)] * size) + x);
            buffer.push((BASE_DATA[offset + (POINT_SIZE * n) + 1] * size) + y);
            buffer.push((BASE_DATA[offset + (POINT_SIZE * n) + 2] * size) + z);
            buffer.push(BASE_DATA[offset + (POINT_SIZE * n) + 3]);
            buffer.push(BASE_DATA[offset + (POINT_SIZE * n) + 4]);
            buffer.push(BASE_DATA[offset + (POINT_SIZE * n) + 5]);
            buffer.push(BASE_DATA[offset + (POINT_SIZE * n) + 6] * size);
            buffer.push(BASE_DATA[offset + (POINT_SIZE * n) + 7] * size);
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
};