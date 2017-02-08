
const processNow = function(size,callback){
    const p = this._private;

    if (size) {
        p.nextCallback = null;
        p.nextSize = 0;

        let buffer = new p.bufferType(size);

        let position = 0;
        let offset = p.position;
        while (position < size && p.buffers.length) {
            if (p.buffers[0].length < offset + size) {
                console.log('a');
                let copy = p.buffers[0].slice(offset);
                console.log('b');
                buffer.set(copy, position, copy.length);
                console.log('c');
                position += copy.length;
                offset = 0;
                p.position -= p.buffers[0].length;
                p.buffers.shift();
            }
            else {
                console.log('d');
                let copy = p.buffers[0].slice(offset, size - position + offset);
                console.log('e');
                buffer.set(copy, position, size - position);
                console.log(buffer);
                console.log('f');
                position = size;
                offset += size - position;
            }
        }
        if (position != size)
            throw new Error('buffer sizes not lining up');
        p.position += size;

        callback(buffer);
    }
};

const buffersMeetSize = function(size){
    const p = this._private;
    let found = -p.position;
    let res = false;
    p.buffers.forEach(buffer=>{
        if (!res) {
            found += buffer.length;
            if (found >= size)
                res = true;
        }
    });
    return res;
};

export default class SplitBuffer {
    constructor(bufferType){
        this._private = {
            buffers:[],
            position:0,
            nextCallback:null,
            nextSize:0,
            bufferType
        };
    }

    addBuffer(buffer){
        const p = this._private;

        p.buffers.push(buffer);

        if (buffersMeetSize.call(this,p.nextSize))
            processNow.call(this, p.nextSize, p.nextCallback);
    }

    process(size,callback){
        const p = this._private;

        if (!size)
            callback([]);
        else if (buffersMeetSize.call(this,size)) {
            processNow.call(this, size, callback);
        }
        else {
            p.nextCallback = callback;
            p.nextSize = size;
        }
    }
}