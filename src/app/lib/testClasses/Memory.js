import Debugger from './Debugger.js';
import md5 from 'md5';

const addBlock = (size)=>{
    const block = {val:[]};
    for (let m=0;m<size/100;m++) {
        block.val[m] = [];
        for (let n = 0; n < 100; n++)
            block.val[m].push(Math.random() * 256);
    }
    block.hash = md5(JSON.stringify(block.val));
    return block;
};

export default class Memory {
    constructor(size=100000,blockFrequency=60) {
        this._private = {
            size:size/8,
            blockFrequency,
            steps:10,
            blocks:[]
        };
    }

    step(delta){
        const p = this._private;
        p.steps++;
        const blocks = Math.ceil(p.steps / p.blockFrequency);
        for (let n=p.blocks.length;n<blocks;n++)
            if (!p.blocks[n]) {
                p.blocks.push(addBlock(p.size));
            }
        Debugger.set('blocks',blocks);
        Debugger.set('blockMem',Math.ceil(blocks*p.size/1000000*8));
        Debugger.set('blockOK',(p.blocks[0].hash==md5(JSON.stringify(p.blocks[0].val)))?'Yes':'No');
    }

    render(){

    }
}
