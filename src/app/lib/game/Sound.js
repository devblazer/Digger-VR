import {Howl} from 'howler';

const soundEnded = function(type,ind){
    const p = this._private;

    if (!this.constructor.SOUND_TYPES[type].loop)
        p.sounds[type].list[ind].ready = true;
};

export default class Sound {
    constructor() {
        const p = this._private = {
            sounds:{},
            volume: 1
        };

        for (let s in this.constructor.SOUND_TYPES) {
            let type = this.constructor.SOUND_TYPES[s];
            p.sounds[s] = {list:[],lastPlay:0};
            for (let n=0; n<type.maxPlay; n++) {
                p.sounds[s].list.push({ready:true, ind:n, howl:new Howl({
                    src: type.src,
                    autoplay: false,
                    loop: type.loop,
                    volume: p.volume * type.volumeFactor,
                    onend: soundEnded.bind(this,s,n)
                })});
            }
        }
    }

    setVolume(volume) {
        this._private.volume = volume;
    }

    play(type,volume=null) {
        const p = this._private;

        if (p.sounds[type].lastPlay > (new Date()).getTime() - this.constructor.SOUND_TYPES[type].minInterval)
            return false;

        let avail = p.sounds[type].list.filter(sound=>{
            return sound.ready;
        });
        if (!avail.length)
            return false;

        avail = avail[0];
        p.sounds[type].lastPlay > (new Date()).getTime();
        avail.ready = false;
        if (volume)
            avail.howl.volume(volume * p.volume * this.constructor.SOUND_TYPES[type].volumeFactor);
        avail.howl.play();

        return this.stop.bind(this,type,avail.ind);
    }

    stop(type,ind=null) {
        const p = this._private;

        if (ind!==null)
            ind = [ind];
        else
            ind = p.sounds[type].list.map((item,key)=>{
                return key;
            });

        ind.forEach(key=> {
            if (!p.sounds[type].list[key].ready)
                p.sounds[type].list[key].howl.stop();
            p.sounds[type].list[key].ready = true;
        });
    }

    static SOUND_TYPES = {
        jump:{
            src:'/sound/380471_acebrian_jump.ogg',
            loop: false,
            minInterval: 1,
            maxPlay: 1,
            volumeFactor: 1.5
        },
        land:{
            src:'/sound/253683_xdimebagx_monster-step-backleg-2-2.ogg',
            loop: false,
            minInterval: 1,
            maxPlay: 1,
            volumeFactor: 0.6
        },
        dig:{
            src:'/sound/150838_toxicwafflezz_bullet-impact-2.ogg',
            loop: false,
            minInterval: 1,
            maxPlay: 3,
            volumeFactor: 0.15
        },
        crumble:{
            src:'/sound/dirt_crumble_custom.ogg',
            loop: false,
            minInterval: 1,
            maxPlay: 1,
            volumeFactor: 0.7
        },
        walk:{
            src:'/sound/98491_tec-studios_walking1-gravel.ogg',
            loop: true,
            minInterval: 1,
            maxPlay: 1,
            volumeFactor: 0.85
        }
    };
}