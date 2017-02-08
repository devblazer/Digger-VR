require("babel-register")({presets:['stage-2','es2015']});

Array.prototype.random = function(){
  return this[Math.floor(Math.random()*this.length)];
};
Array.prototype.randomIndex = function(){
  return Math.floor(Math.random()*this.length);
};

var express = require('express');
var fs = require('fs');
var path = require('path');
var httpProxy = require('http-proxy');
var http = require('http');
var proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true
});
var crypto = require('crypto');
var app = express();
var isProduction = process.env.NODE_ENV === 'production';
var port = isProduction ? process.env.PORT : 3000;
var publicPath = path.resolve(__dirname, '../public');
var io;

app.use(express.static(publicPath));
var IO = require('socket.io');

var SplitBuffer = require('./app/lib/data/SplitBuffer.js').default;

if (!isProduction) {

  var bundle = require('./server/bundle.js');
  bundle();
  app.all('/build/*', function (req, res) {
    proxy.web(req, res, {
        target: 'http://127.0.0.1:3001'
    });
  });
  app.all('/socket.io*', function (req, res) {
    proxy.web(req, res, {
      target: 'http://127.0.0.1:3001'
    });
  });


  proxy.on('error', function(e) {
    // Just catch it
  });

  // We need to use basic HTTP service to proxy
  // websocket requests from webpack
  var server = http.createServer(app);
  io = IO(server);

  server.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head);
  });

  server.listen(port, function () {
    console.log('Server running on port ' + port);
  });

} else {

  // And run the server
  app.listen(port, function () {
    console.log('Server running on port ' + port);
  });
  io = IO(http.Server(app));
}

var users = {};
var connections = {};

var Mongo = require('mongodb');
var MongoClient = Mongo.MongoClient;
var url = 'mongodb://localhost:27017/digger_vr';

MongoClient.connect(url, function(err, db) {
  if (err) {
    console.log(err);
    return;
  }
  var usersCollection = db.collection('users');
  var gamesCollection = db.collection('games');

  io.on('connection',function(socket){
    var connection_id = crypto.randomBytes(8).toString('hex');
    console.log('connected: '+connection_id);
    var connection = connections[connection_id] = {id:connection_id};
    connection.user = {id:'asdfghjk',games:[]};
    gamesCollection.find({userID:connection.user.id}).toArray((err,docs)=>{
      if (err) {
        console.log(err);
        docs = [];
      }
      connection.user.games = docs;
      socket.emit('user_games_list',docs);

      socket.on('request_map',function(data){
        var mapFiles = [];
        fs.readdir('./private/maps/generated/size_'+data.data.size,function(err,files){
          if (err)
            console.log(err);
          else {
            for (var p = 0; p < files.length; p++) {
              if (map = files[p].match(/^map_([a-f0-9A-F]{8})\.map$/))
                mapFiles.push({fileID: map[1], size: data.data.size});
            }
            if (!mapFiles.length)
              console.log('could not find a suitable map file');
            else
              socket.emit('request_map_' + data.onceID, mapFiles.random());
          }
        });
      });

      socket.on('new_game',function(data){
        data.data.gameID = crypto.randomBytes(16).toString('hex');
        gamesCollection.insert({id:data.data.gameID,name:data.data.gameName,mapSize:data.data.mapSize},err=>{
          if (err) {
            console.log(err);
            return;
          }

          connection.currentMap = data.data.fileID;
          connection.currentGame = data.data.gameID;
          connection.mapSize = data.data.size;
          //var mapCollection = db.collection(data.data.gameID);
          //mapCollection.createIndex({x:1,y:1,z:1});

          var axisBound = connection.mapSize/8;
          var stream = fs.createReadStream('./private/maps/generated/size_'+connection.mapSize+'/map_'+connection.currentMap+'.map',{flags:'r'});

          const splitBuffer = new SplitBuffer(Uint8Array);
          let blockInd = 0;
          const insertsExpected = Math.pow(axisBound,3);
          let insertsDone = 0;

          const processSize = buffer=>{
            const tiles = (buffer[0]*256)+buffer[1];
            splitBuffer.process(tiles,processBlock);
          };
          const processBlock = buffer=>{
            if (buffer.length) {
              let z = Math.floor(blockInd / (axisBound*axisBound));
              let y = Math.floor((blockInd - (z*axisBound*axisBound)) / axisBound);
              let x = blockInd % axisBound;
/*              mapCollection.insert({x,y,z,data:new Mongo.Binary(buffer)},err=>{
                if (err)
                    console.log(err);
                insertsDone++;
                
                if (insertsDone == insertsExpected)
                  socket.emit('new_game_' + data.onceID, data.data);
              });*/
            }
            blockInd++;
            if (blockInd<insertsExpected)
              splitBuffer.process(2,processSize);
          };
          splitBuffer.process(2,processSize);

          stream.addListener('data', chunk=>{
            splitBuffer.addBuffer(new Uint8Array(chunk));
          },()=>{
            // do nothing;
          });
        });
      });

      socket.on('load_game',function(data){
        connection.currentGame = data.data.gameID;
        connection.mapSize = data.data.size;
        socket.emit('load_game_'+data.onceID,true);
      });

      socket.on('download_map',function(data){
        console.log(data);
        const axisBound = connection.mapSize/8;
//        var mapCollection = db.collection(connection.currentGame);
        let count = 0;
        let complete = Math.pow(axisBound,3);

        for (let z=0;z<axisBound;z++) {
          for (let y=0;y<axisBound;y++) {
            for (let x=0;x<axisBound;x++) {
              /*mapCollection.find({x,y,z}).toArray((err,docs)=>{
                count++;
                if (err)
                    console.log(err);
                else
                  socket.emit('download_map_part_'+data.partID,docs[0].data);
                if (count==complete)
                  socket.emit('download_map_end_'+data.partID,true);
              });*/
            }
          }
        }
      });

      socket.on('disconnect',function(){
        console.log('disconnected: '+connection_id);
        delete(connections[connection_id]);
      });
    });
  });
});