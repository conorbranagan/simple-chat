"use strict"

var MESSAGE_TYPE = require('./constants').MESSAGE_TYPE,
    SEQUENCE = 1;

class ChatUser {
  constructor(id, conn) {
    this.id = id;
    this.conn = conn;
    this.handle = 'Unknown';
  }

  setHandle(handle) {
    console.log("[Chat User][id=%s] Set handle to %s", this.id, handle);
    this.handle = handle;
  }

  sendMessage(message) {
    this.conn.send(JSON.stringify(message));
  }

  logout() {
    // TODO: Any clean up is performed here.
  }

  serialize() {
    return {
      id: this.id,
      handle: this.handle
    };
  }
}

class ChatServer {
  constructor(wss) {
    this.wss = wss;
    this.users = {};
  }

  listen() {
    this.wss.on('connection', ws => {
      var id = ++SEQUENCE;
      this.openConnection(id, ws);
      ws.on('message', this.handleMessage.bind(this, id));
      ws.on('close', this.closeConnection.bind(this, id));
    });
    return this;
  }

  openConnection(connID, conn) {
    console.log("[Chat Server][id=%s] Opening connection", connID);
    var user = new ChatUser(connID, conn);
    user.sendMessage({
      type: MESSAGE_TYPE.SERVER_JOIN,
      id: connID,
      users: Object.keys(this.users).map(key => this.users[key].serialize())
    });
    this.users[connID] = user;
  }

  handleMessage(connID, message) {
    var msg = JSON.parse(message);
    switch(msg.type) {
      case MESSAGE_TYPE.SET_USER:
        this.users[connID].setHandle(msg.handle);
        this.broadcastMessage({
          type: MESSAGE_TYPE.USER_JOIN,
          user: this.users[connID].serialize()
        });
        break;
      case MESSAGE_TYPE.CLIENT_MESSAGE:
        // TODO: Validate username.
        this.broadcastMessage({
          type: MESSAGE_TYPE.SERVER_MESSAGE,
          user: this.users[msg.userID].serialize(),
          text: msg.text
        });
        break;
      default:
        console.log("[Chat Server][id=%s] Unknown message type: %s", connID, msg.type);
    }
  }

  broadcastMessage(message) {
    Object.keys(this.users).forEach(k => this.users[k].sendMessage(message));
  }

  closeConnection(connID) {
    var user = this.users[connID];
    user.logout();
    delete this.users[connID];
    console.log("[Chat Server][id=%s] Closing connection", connID);
    this.broadcastMessage({
      type: MESSAGE_TYPE.USER_LEAVE,
      user: user.serialize()
    });
  }
};

exports.ChatServer = ChatServer;
