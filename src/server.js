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

io.on('connection',function(socket){
  var user_id = crypto.randomBytes(8).toString('hex');
  console.log('connected: '+user_id);
  var user = users[user_id] = {id:user_id};

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

  socket.on('set_map',function(data){
    user.currentMap = data.data.fileID;
    user.mapSize = data.data.size;
    socket.emit('set_map_'+data.onceID,true);
  });

  socket.on('download_map',function(data){
    console.log(data);
    console.log('./private/maps/generated/size_'+user.mapSize+'/map_'+user.currentMap+'.map');
    var stream = fs.createReadStream('./private/maps/generated/size_'+user.mapSize+'/map_'+user.currentMap+'.map',{flags:'r'});
    let offset = 0;
    let total = 0;
    stream.addListener('data', function (chunk) {
      while (offset<chunk.length) {
        let bint = chunk[offset];
        let sint = chunk[offset + 1];
        let cnt = bint * 256 + sint;
        total += cnt;
        offset += 2 + cnt;
      }
      socket.emit('download_map_part_'+data.partID,chunk);
    });
    stream.addListener('end', function () {
      socket.emit('download_map_end_'+data.partID,true);
    });
  });

  socket.on('disconnect',function(){
    console.log('disconnected: '+user_id);
    delete(users[user_id]);
  });
});
