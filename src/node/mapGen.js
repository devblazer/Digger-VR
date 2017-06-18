require("babel-register")({presets:['stage-2','es2015']});

var express = require('express');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var Map = require('./../app/lib/game/Map.js').default;

if (process.argv[2] && process.argv[2].split('=')[0] == '--gen') {
    var size = process.argv[2].split('=')[1]/1;
    var MapGenerator = require('./../app/lib/generation/MapGenerator.js').default;
    var map = new Map(null,size);
    var gen = new MapGenerator(map);
    console.log(gen.autoGenerate());

    var name = crypto.randomBytes(32).toString('hex').substr(0,8);
    var stream = fs.createWriteStream(path.resolve(__dirname, './../../private/maps/generated/size_'+size+'/map_'+name+'.map'),{encoding:'ascii'});
    stream.once('open', function (fd) {
        var total = 0;
        var lots = 0;
        var blanks = 0;
        var inc = 100;
        map.foreachPlot(function (x, y, z) {
            var data = map.exportPlot(x, y, z);
            total += 2 + (data?(data.length):0);
            lots++;
            blanks += data ? 0 : 1;
            var intb = data?Math.floor(data.length/256):0;
            var ints = data?(data.length%256):0;
            console.log(x,y,z);
            console.log(intb,ints);
            stream.write(new Buffer([intb,ints], 'ascii'));
            inc+=2;
            if (data)
                stream.write(data);
        });
        console.log(total, lots, blanks);
        stream.end();
        console.log(size);
    });
}
