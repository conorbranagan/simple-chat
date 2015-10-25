"use strict"

// Websocket Server
var server = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });

// Chat Server
var ChatServer = require('./chat-server').ChatServer;
var cs = new ChatServer(wss).listen();

// App initialization
var path = require('path');
var express = require('express');
var app = express();
var port = 3000;

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.render('index');
});

server.on('request', app);
server.listen(port, function() { console.log('Listening on %s', port); });
