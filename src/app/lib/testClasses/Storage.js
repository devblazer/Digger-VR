import Debugger from './Debugger.js';

const addBlock = (size)=>{
    const block = {val:[]};
    for (let m=0;m<size/100;m++) {
        block.val[m] = [];
        for (let n = 0; n < 100; n++)
            block.val[m].push(Math.random() * 256);
    }
    return block;
};

export default class Storage {
    constructor(db,size=100000,blockFrequency=60) {
        this._private = {
            size:size/8,
            blockFrequency,
            db,
            steps:0,
            blocks:0
        };
        db.clear();
    }

    step(delta){
        const p = this._private;
        p.steps++;
        const blocks = Math.ceil(p.steps / p.blockFrequency);
        for (let n=p.blocks;n<blocks;n++)
            if (!p.blocks[n]) {
                p.db.set('main',{id:'b'+n,data:addBlock(p.size)});
            }
        Debugger.set('blocks',blocks);
        Debugger.set('blockMem',Math.ceil(blocks*p.size/1000000*8));
    }
}
