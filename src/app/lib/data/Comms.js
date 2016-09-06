import io from 'socket.io-client';
import Util from './../Util.js';

export default class Comms {
    constructor(debug=false){
        const p = this._private = {
            socket:io(),
            debug,
            whenReady:null
        };
    }

    emit(action,data){
        const p = this._private;
        if (!p.socket)
            throw new Error('connection not active');

        if (p.debug) console.log('emit',action,data);
        p.socket.emit(action,data);
    }

    on(action,callback){
        const p = this._private;
        if (!p.socket)
            throw new Error('connection not active');

        p.socket.on(action,data=>{
            if (p.debug) console.log('on',action);
            callback(data);
        });
    }

    fetch(action,data,callback,finalCallback){
        const p = this._private;
        if (!p.socket)
            throw new Error('connection not active');

        let UID = Util.uid();
        if (!finalCallback) {
            if (p.debug) console.log('fetchO',action,data);
            p.socket.emit(action, {data, onceID:UID});
            p.socket.once(action + '_' + UID, data=>{
                if (p.debug) console.log('fetchRes',action);
                callback(data);
            });
        }
        else {
            if (p.debug) console.log('fetchM',action,data);
            p.socket.emit(action, {data, partID:UID});
            p.socket.on(action + '_part_' + UID, data=>{
                if (p.debug) console.log('fetchPart',action);
                callback(data);
            });
            p.socket.once(action + '_end_' + UID, data=>{
                p.socket.removeListener(action,callback);
                if (p.debug) console.log('fetchEnd',action);
                if (typeof finalCallback == 'function')
                    finalCallback(data);
            });
        }
    }
}