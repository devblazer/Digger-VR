import Subscription from './Subscription.js';
import $ from 'jquery';

export default class State extends Subscription {
    constructor(settings=[]){
        super();
        this._private = {
            ...this._private,
            settings,
            props:{}
        };
    }

    get(prop){
        const p = this._private;
        if (typeof p.props[prop] != 'undefined')
            return p.props[prop];
        else if (typeof p.settings[prop] != 'undefined')
            return p.settings[prop];
    }

    set(prop,val){
        if (typeof prop == 'object') {
            for (let o in prop)
                this.set(o,prop[o]);
        }
        else {
            const p = this._private;
            if (typeof p.settings[prop] != 'undefined')
                throw new Error('Cannot override a fixed setting in a state manager');
            let oldVal = p.props[prop];
            p.props[prop] = val;
            this.trigger('stateChanged', {prop, val, oldVal});
        }
    }

    export(){
        const p = this._private;
        return {...p.settings,...p.props};
    }

    feed(){
        const me = this;
        return {
            get:prop=>{
                return me.get(prop);
            },
            export:()=>{
                return me.export();
            }
        };
    }
};