const BLOCK_DATA = {
    empty: {
        type:'empty',
        ind:0,
        name:'Empty',
        digsInto:'empty',
        spray1:[0,0,0],
        spray2:[0,0,0],
        sprayDensity:0,
        texFaceInd:[0,0,0],
        strength:0
    },
    dirt: {
        type:'dirt',
        ind:1,
        name:'Dirt',
        digsInto:'dirt',
        spray1:[54,36,7],
        spray2:[141,116,73],
        sprayDensity:1,
        texFaceInd:[1,1,1],
        strength:1
    },
    grass: {
        type:'grass',
        ind:2,
        name:'Grass',
        digsInto:'dirt',
        spray1:[54,36,7],
        spray2:[141,116,73],
        sprayDensity:1,
        texFaceInd:[3,2,1],
        strength:1
    },
    stone: {
        type:'stone',
        ind:3,
        name:'Stone',
        digsInto:'stone',
        spray1:[191,189,177],
        spray2:[83,81,69],
        sprayDensity:0.4,
        texFaceInd:[4,4,4],
        strength:2
    },
    impenetrable: {
        type:'impenetrable',
        ind:4,
        name:'Impenetrable',
        digsInto:'impenetrable',
        spray1:[0,0,0],
        spray2:[0,0,0],
        sprayDensity:0,
        texFaceInd:[5,5,5],
        strength:-1
    }
};

const IND_LOOKUP = ['empty','dirt','grass','stone','impenetrable'];

class BlockData {
    constructor(type) {
        const p = this._private = BLOCK_DATA[type];
    }

    get type() {
        return this._private.type;
    }
    get name() {
        return this._private.name;
    }
    get digsInto() {
        return this._private.digsInto;
    }
    get texFaceInd() {
        return this._private.texFaceInd;
    }
    get strength() {
        return this._private.strength;
    }
}

const ret = IND_LOOKUP.map(name=>{return new BlockData(name)});
ret.forEach(blockData=>{
    ret[blockData.name] = blockData;
});
export default ret;