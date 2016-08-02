
class Debugger {
    constructor() {
        this._private = {
            vars:[]
        };
    }

    set(name,val){
        this._private.vars[name] = val;
    }
    get(name){
        return this._private.vars[name];
    }

    step(){

    }

    render(){
        let str = '';
        for (let p in this._private.vars) {
            str += '<p><strong>'+p+': </strong>'+this._private.vars[p]+'</p>';
        }
        document.getElementById('debugger').innerHTML = str;
        this._private.vars = [];
    }
}
const debug = new Debugger();
export default debug;
