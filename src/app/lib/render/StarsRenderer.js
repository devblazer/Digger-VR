const createStars = function(xs,xe,ys,ye,zs,ze) {
    let count = (xe-xs)*(ye-ys)*(ze-zs)*this._private.rate;
    const rem = count-Math.floor(count);
    count = Math.floor(count) + (Math.random()<=rem?1:0);

    for (var c=0;c<count;c++) {
        var x = (Math.random()*(xe-xs))+xs;
        var y = (Math.random()*(ye-ys))+ys;
        var z = (Math.random()*(ze-zs))+zs;
        var b = Math.min(Math.random()*1.5,1);
        var g = Math.min(Math.random()+(b/4),1);
        if (g>b)
            var r = (Math.random()*(g-b))+b;
        else
            var r = Math.random()*g;
        this._private.stars.push(x);
        this._private.stars.push(y);
        this._private.stars.push(z);
        this._private.stars.push(r);
        this._private.stars.push(g);
        this._private.stars.push(b);
    }
};

const shiftStars = function(arenaSize,lastCamera,shiftX,shiftY) {
    if (shiftX || shiftY) {
        console.log(shiftX+' '+shiftY);
        shiftX *= arenaSize[0]*2;
        shiftY *= arenaSize[1]*2;
        for (let s=0;s<this._private.stars.length;s+=6) {
            this._private.stars[s+0] += shiftX;
            this._private.stars[s+1] += shiftY;
        }
        lastCamera[0] += shiftX;
        lastCamera[1] += shiftY;
    }
};

const updateStars = function(arena,camera,lastCamera) {
    const self = this._private;
    const arenaSize = arena.getHalfSize();

    shiftStars.call(
        this,
        arenaSize,
        lastCamera,
        camera[0]-lastCamera[0]>arenaSize[0]
            ?1
            :(camera[0]-lastCamera[0]<-arenaSize[0] ? -1 : 0),
        camera[1]-lastCamera[1]>arenaSize[1]
            ?1
            :(camera[1]-lastCamera[1]<-arenaSize[1] ? -1 : 0)
    );

    var xy = self.spread / 2;
    var z = self.depth;
    for (let st = self.stars.length - 1; st >= 0; st--) {
        let s = self.stars;
        let o = st*6;
        if (s[o] < camera[0] - xy || s[o] > camera[0] + xy || s[o+1] < camera[1] - xy || s[o+1] > camera[1] + xy || s[o+2] > camera[2] || s[o+2] < camera[2] - z) {
            self.stars.splice(o, 6);
        }
    }

    if (camera[0]<lastCamera[0])
        createStars.call(this,
            camera[0]-(self.spread/2),lastCamera[0]-(self.spread/2),
            camera[1]-(self.spread/2),camera[1]+(self.spread/2),
            camera[2]-self.depth,camera[2]
        );
    if (camera[0]>lastCamera[0])
        createStars.call(
            this,
            lastCamera[0]+(self.spread/2),camera[0]+(self.spread/2),
            camera[1]-(self.spread/2),camera[1]+(self.spread/2),
            camera[2]-self.depth,camera[2]
        );
    if (camera[1]<lastCamera[1])
        createStars.call(
            this,
            camera[0]-(self.spread/2),camera[0]+(self.spread/2),
            camera[1]-(self.spread/2),lastCamera[1]-(self.spread/2),
            camera[2]-self.depth,camera[2]
        );
    if (camera[1]>lastCamera[1])
        createStars.call(
            this,
            camera[0]-(self.spread/2),camera[0]+(self.spread/2),
            lastCamera[1]+(self.spread/2),camera[1]+(self.spread/2),
            camera[2]-self.depth,camera[2]
        );
    if (camera[2]<lastCamera[2])
        createStars.call(
            this,
            camera[0]-(self.spread/2),camera[0]+(self.spread/2),
            camera[1]-(self.spread/2),camera[1]+(self.spread/2),
            camera[2]-self.depth,lastCamera[2]-self.depth
        );
    if (camera[2]>lastCamera[2])
        createStars.call(
            this,
            camera[0]-(self.spread/2),camera[0]+(self.spread/2),
            camera[1]-(self.spread/2),camera[1]+(self.spread/2),
            lastCamera[2],camera[2]
        );
};

export default class StarsRenderer {
    constructor(spread,depth,count){
        this._private = {
            count,
            spread,
            depth,
            rate:count/(spread*spread*depth),
            stars:[]
        };

        createStars.call(this,spread/-2,spread/2,spread/-2,spread/2,depth/-2,depth/2);
    }

    update(arena,camera,lastCamera){
        updateStars.call(this,arena,camera,lastCamera);
    }

    getCount(){
        return this._private.stars.length/6;
    }

    getForRender(){
        return this._private.stars;
    }
}