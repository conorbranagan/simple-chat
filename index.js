var server = require('http').createServer(),
    url = require('url'),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ server: server }),
    express = require('express'),
    app = express(),
    port = 3000;

// Set up the templating.
app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('index');
});

var connSequence = 0,
    activeConnections = {},
    users = {};

var MESSAGE_TYPES = {
  INIT: 'init',
  SET_USER: 'set_user',
  MESSAGE: 'message',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave'
}

var postMessage = function(message) {
  for (k in activeConnections) {
    activeConnections[k].send(JSON.stringify(message));
  }
}

wss.on('connection', function connection(ws) {
  var id = connSequence++;
  activeConnections[id] = ws;
  console.log('[id=%s] Opening connection', id);
  ws.send(JSON.stringify({
    type: MESSAGE_TYPES.INIT,
    users: Object.keys(users).map(key => users[key])
  }));

  ws.on('message', function incoming(message) {
    var msg = JSON.parse(message);
    switch(msg.type) {
      case MESSAGE_TYPES.SET_USER:
        console.log('[id=%s] Setting username to %s', id, msg.username);
        users[id] = {name: msg.username};
        postMessage({
          type: MESSAGE_TYPES.USER_JOIN,
          user: users[id]
        });
        break;
      case MESSAGE_TYPES.MESSAGE:
        // TODO: Validate username.
        postMessage(msg);
        break;
    }
  });

  ws.on('close', function() {
    console.log('Closing connection id=%s', id);
    delete activeConnections[id];
    postMessage({
      type: MESSAGE_TYPES.USER_LEAVE,
      user: users[id]
    });
    delete users[id];
  });

});

server.on('request', app);
server.listen(port, function() { console.log('Listening on %s', port); });
