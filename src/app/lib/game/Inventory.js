import Item from './Item.js';

export default class Inventory {
    constructor() {
        const p = this._private = {
            slots:[],
            beltSlots:[],
            beltSelected:0
        };

        this.clear();
    }

    clear() {
        const p = this._private;

        p.slots = [];
        for (let i=0;i<this.constructor.POUCH_SLOTS_COUNT;i++) {
            p.beltSlots.push(i);
            p.slots.push(null);
        }
    }
    
    locate(type) {
        return this._private.slots.reduce((aggr,item,ind)=>{
            return aggr===null && item && item.type==type ? ind : aggr;
        },null);
    }

    avail() {
        return this._private.slots.reduce((aggr,slot,ind)=>{
            return slot===null && aggr===null ? ind : aggr;
        },null);
    }

    beltNext() {
        const p = this._private;

        p.beltSelected++;
        if (p.beltSelected==this.constructor.POUCH_SLOTS_COUNT)
            p.beltSelected = 0;
    }
    beltPrev() {
        const p = this._private;

        p.beltSelected--;
        if (p.beltSelected<0)
            p.beltSelected = this.constructor.POUCH_SLOTS_COUNT-1;
    }
    get beltSelected() {
        return this._private.beltSelected;
    }

    getBelt(slotNo){
        const p = this._private;
        return p.slots[p.beltSlots[slotNo]];
    }

    get(slotNo) {
        slotNo = isNaN(slotNo) ? this.locate(slotNo) : slotNo;
        return slotNo===null ? null : this._private.slots[slotNo];
    }
    
    equip(item, slotNo=null) {
        if (slotNo===null && item) {
            let location = this.locate(item.type);
            if (location!==null) {
                let existing = this.get(location);
                if (existing.merge(item)) {
                    item = existing;
                    slotNo = location;
                }
            }
            if (slotNo===null)
                slotNo = this.avail();
            else
                return slotNo;
        }
        if (slotNo!==null)
            this._private.slots[slotNo] = item;
        return slotNo;
    }

    status() {
        let ret = {};
        this._private.slots.forEach((item,ind)=>{
            if (item)
                ret[item.type] = {type:item.type,qty:item.qty,slot:ind};
        });
        return ret;
    }

    getBeltSlots() {
        return this._private.beltSlots.map(ind=>{
            return this.getBelt(ind);
        });
    }
    
    static get POUCH_SLOTS_COUNT() {
        return 5;
    } 
}