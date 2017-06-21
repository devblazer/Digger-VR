const ITEM_DATA = {
    dirtBlock: {
        ind:0,
        type:'dirtBlock',
        category:'placeble_block',
        typeInd:1
    },
    stoneBlock: {
        ind:1,
        type:'stoneBlock',
        category:'placeble_block',
        typeInd:3
    }
};

const IND_LOOKUP = [];
for (let p in ITEM_DATA)
    IND_LOOKUP[ITEM_DATA[p].ind] = p;

export default class Item {
    constructor(type,qty=1) {
        type = this.constructor.getType(type);
        const p = this._private = {
            typeData: ITEM_DATA[type],
            qty
        };
    }

    getProp(prop) {
        return this._private.typeData[prop];
    }

    get type() {
        return this._private.typeData.type;
    }
    get category() {
        return this._private.typeData.category;
    }
    get ind() {
        return this._private.typeData.ind;
    }

    get qty() {
        return this._private.qty;
    }
    set qty(val) {
        this._private.qty = val;
    }

    merge(item) {
        const p = this._private;

        if (p.typeData.type != item.getProp('type'))
            return false;

        p.qty += item.qty;
        return this;
    }

    static getType(ind) {
        return isNaN(ind) ? ind : IND_LOOKUP[ind/1];
    }
};
