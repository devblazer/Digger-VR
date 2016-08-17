export default class Subscription {
    constructor(){
        this._private = {
            events:{}
        }
    }

    subscribe(eventType,callback,args=null){
        const me = this;
        const p = this._private;
        if (!p.events[eventType])
            p.events[eventType] = [];
        const subscription = {eventType,callback,args};
        p.events[eventType].push(subscription);
        return ()=>{
            p.events[eventType].splice(p.events[eventType].indexOf(subscription),1);
        };
    }

    unsubscribe(eventType){
        this._private.events[eventType] = [];
    }

    trigger(eventType,args=null){
        const p = this._private;
        if (p.events[eventType])
            p.events[eventType].forEach(subscription=>{
                subscription.callback(args?args:eventType,subscription.args);
            });
    }
}