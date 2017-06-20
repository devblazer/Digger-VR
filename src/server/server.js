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
var publicPath = path.resolve(__dirname, './../../public');
var io;

app.use(express.static(publicPath));
var IO = require('socket.io');

var SplitBuffer = require('./../app/lib/data/SplitBuffer.js').default;

if (!isProduction) {

  var bundle = require('./bundle.js');
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

  var newGameQue = [];
  var newGameQueBusy = false;
  var newGameInsertCue = [];
  var NEW_GAME_INSERT_LIMIT = 250;

  function processNewGameCue() {
    console.log('process new game que: '+newGameQue.length);
    if (newGameQueBusy || !newGameQue.length)
      return;
    newGameQueBusy = true;
    newGameQue.shift()(function(){
      newGameQueBusy = false;
      processNewGameCue();
    });
  }

  io.on('connection',function(socket){
    var connection_id = crypto.randomBytes(8).toString('hex');
    console.log('connected: '+connection_id);
    var connection = connections[connection_id] = {id:connection_id};

    function send_games_list() {
      gamesCollection.find({userID:connection.user.id}).toArray((err,docs)=> {//userID:connection.user.id
        if (err) {
          console.log(err);
          docs = [];
        }
        connection.user.games = docs;
        socket.emit('user_games_list', docs);
      });
    }

    socket.on('get_salt',function(data){
      usersCollection.findOne({username:data.data},(err,doc)=> {
        if (err) {
          console.log(err);
          return;
        }
        if (!doc)
          return;

        socket.emit('get_salt_' + data.onceID, {status: true, salt: doc.salt});
      });
    });

    socket.on('attempt_login',function(data){
      usersCollection.findOne({username:data.data[0]},(err,doc)=> {
        if (err) {
          console.log(err);
          return;
        }

        var res = doc.password == data.data[1];
        if (res) {
          connection.user = {id:doc.id,games:[]};
          send_games_list();
        }
        socket.emit('attempt_login_' + data.onceID, {status: res});
      });
    });

    socket.on('new_salt',function(data){
      usersCollection.findOne({username:data.data},(err,doc)=> {
        if (err) {
          console.log(err);
          return;
        }
        var salt = crypto.randomBytes(16).toString('hex');

        socket.emit('new_salt_' + data.onceID, {status: !doc, salt});
      });
    });

    socket.on('attempt_register',function(data){
      usersCollection.findOne({username:data.data[0]},(err,doc)=> {
        if (err) {
          console.log(err);
          return;
        }
        if (doc)
            return;

        var user = {id:crypto.randomBytes(16).toString('hex'),username:data.data[0],password:data.data[1],salt:data.data[2]};
        usersCollection.insertOne(user,err=>{
          if (err) {
            console.log(err);
            return;
          }

          connection.user = {id:user.id,games:[]};
          send_games_list();
          socket.emit('attempt_register_' + data.onceID, {status: true});
        });
      });
    });

    socket.on('request_map',function(data){
      if (!connection.user)
          return;

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
      if (!connection.user)
        return;

      newGameQue.push(function (newGameDone) {
        console.log('new_game',data);
        data.data.gameID = crypto.randomBytes(16).toString('hex');
        gamesCollection.insertOne({id:data.data.gameID,userID:connection.user.id,name:data.data.gameName,mapSize:data.data.size},err=> {
          if (err) {
            console.log(err);
            return;
          }

          connection.currentMap = data.data.fileID;
          connection.currentGame = data.data.gameID;
          connection.mapSize = data.data.size;
          var mapCollection = db.collection('map_' + data.data.gameID);
          mapCollection.createIndex({x: 1, y: 1, z: 1});

          var axisBound = connection.mapSize / 8;
          var stream = fs.createReadStream('./private/maps/generated/size_' + connection.mapSize + '/map_' + connection.currentMap + '.map', {flags: 'r'});

          const splitBuffer = new SplitBuffer(Uint8Array);
          let blockInd = 0;
          const insertsExpected = Math.pow(axisBound, 3);
          let insertsDone = 0;
          let tiles = 0;

          const handleInsert = (insertDone) => {
            setTimeout(()=>{
              if (!newGameInsertCue.length)
                insertDone();
              else {
                mapCollection.insertMany(newGameInsertCue, err => {
                  if (err)
                    console.log(err);

                  insertsDone+=newGameInsertCue.length;
                  newGameInsertCue = [];
                  console.log('Copy: '+Math.floor(insertsDone/insertsExpected*100)+'%');
                  if (insertsDone == insertsExpected) {
                    console.log('new game');
                    socket.emit('new_game_' + data.onceID, data.data);
                    newGameDone();
                  }

                  insertDone();
                });
              }
            },1);
          };

          const processSize = buffer=> {
            tiles = (buffer[0] * 256) + buffer[1];
            splitBuffer.process(tiles, processBlock);
          };
          const processBlock = buffer=> {
            let z = Math.floor(blockInd / (axisBound * axisBound));
            let y = Math.floor((blockInd - (z * axisBound * axisBound)) / axisBound);
            let x = blockInd % axisBound;

            newGameInsertCue.push({x, y, z, data: new Mongo.Binary(new Buffer(buffer))});

            blockInd++;
            if (blockInd < insertsExpected)
              splitBuffer.process(2, processSize);
          };
          splitBuffer.process(2, processSize);

          stream.addListener('data', chunk=> {
            splitBuffer.addBuffer(new Uint8Array(chunk));

            if (newGameInsertCue.length >= NEW_GAME_INSERT_LIMIT) {
              stream.pause();

              handleInsert(()=>{
                stream.resume();
              });
            }
          }, ()=> {
            // do nothing;
          });
          stream.addListener('end', ()=> {
            send_games_list();
            handleInsert(()=>{
              // do nothing;
            });
          }, ()=> {
            // do nothing;
          });
        });
      });
      processNewGameCue();
    });

    socket.on('delete_game',function(gameID){
      if (!connection.user)
        return;

      gamesCollection.findOne({userID:connection.user.id,id:gameID},(err,doc)=>{
        if (err || !doc)
            console.log(err || 'invalid game removal');

        db.collection('map_' + gameID).drop();
        gamesCollection.remove({id:gameID},()=> {
          if (connection.currentGame == gameID) {
            connection.currentGame = null;
            connection.mapSize = null;
          }
          send_games_list();
        });
      });
    });

    socket.on('load_game',function(data){
      if (!connection.user)
        return;

      gamesCollection.findOne({userID:connection.user.id,id:data.data.gameID},(err,doc)=> {
        if (err || !doc)
          console.log(err || 'invalid game load');

        connection.currentGame = data.data.gameID;
        connection.mapSize = data.data.size;
        socket.emit('load_game_' + data.onceID, true);
      });
    });

    socket.on('update_plot',function(data) {
      if (!connection.user || !connection.currentGame)
        return;

      let mapCollection = db.collection('map_'+connection.currentGame);
      mapCollection.updateOne({x:data.x,y:data.y,z:data.z},{ $set: { data: new Mongo.Binary(new Buffer(data.data)) }});
    });

    socket.on('download_map',function(data){
      if (!connection.user || !connection.currentGame)
        return;

      const axisBound = connection.mapSize/8;
      let mapCollection = db.collection('map_'+connection.currentGame);
      let count = 0;
      let complete = Math.pow(axisBound,3);

      let y=z=0;

      let interval = setInterval(()=>{
        ((y, z)=> {
          mapCollection.find({y, z}).sort({x:1}).toArray((err, docs)=> {
            count+=docs.length;
            if (err)
              console.log(err);
            else
              docs.forEach(doc=>{
                socket.emit('download_map_part_' + data.partID, {x:doc.x, y, z, d: new Buffer(doc.data.buffer)});//new Uint8Array(docs[0].data.buffer));
              });

            console.log('Download: ' + Math.floor(count / complete * 100) + '%', count, complete);
            if (count == complete) {
              console.log('end');
              socket.emit('download_map_end_' + data.partID, true);
            }
          });
        })(y, z);

        y++;
        if (y >= axisBound) {
          y = 0;
          z++;
        }
        if (z >= axisBound)
          clearInterval(interval);
      },1);
    });

    socket.on('disconnect',function(){
      console.log('disconnected: '+connection_id);
      delete(connections[connection_id]);
    });
  });
});