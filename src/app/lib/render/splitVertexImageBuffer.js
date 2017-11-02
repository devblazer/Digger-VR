export default class SplitVertexImageBuffer {
    constructor(bufferName, webGL, size) {
        this._private = {
            buffers:[],
            currentBuffer:0,
            webGL,
            size,
            bufferName
        }
    }
    
    reset() {
        this._private.currentBuffer = 0;
        this._private.buffers.forEach(buffer=>{
            buffer.used = 0;
        });
    }
    
    getBuffer(ind) {
        const p = this._private;
        if (!p.buffers[ind])
            p.buffers[ind] = {buf:p.webGL.createDataTexture(p.bufferName+ind, p.size), used:0, name:p.bufferName+ind};
        return p.buffers[ind];
    }
    
    add(buffer) {
        const p = this._private;
        let target = this.getBuffer(p.currentBuffer);
        if (target.used+buffer.buffer.byteLength >= p.size*p.size) {
            p.currentBuffer++;
            target = this.getBuffer(p.currentBuffer);
        }
        target.buf.set(buffer, target.used);
        target.used += buffer.buffer.byteLength;
    }

    forEach(func) {
        this._private.buffers.forEach(func);
    }
}