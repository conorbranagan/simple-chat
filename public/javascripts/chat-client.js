"use strict"

const MESSAGE_TYPES = {
  SERVER_JOIN: 'server_join',
  SET_USER: 'set_user',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  CLIENT_MESSAGE: 'client_message',
  SERVER_MESSAGE: 'server_message'
}

class ChatClient {
  constructor(conn, handle) {
    this.conn = conn;
    this.handle = handle;
    this.users = [];
    this.id = -1;

    // FIXME: Separate UI from client.
    this.messageList = document.querySelector('#messages');
    this.userList = document.querySelector('#user_list');
    this.bindEvents();
  }

  start() {
    this.conn.onopen = function() {
      // Initialize user on connection open.
      this.conn.send(JSON.stringify({
        type: MESSAGE_TYPES.SET_USER,
        handle: this.handle
      }));
    }.bind(this);

    this.conn.onmessage = function(e) {
      // Handle messages.
      let msg = JSON.parse(e.data);
      switch(msg.type) {
        case MESSAGE_TYPES.SERVER_JOIN:
          this.users = msg.users;
          this.id = msg.id;
          this.refreshUserList();
          break;
        case MESSAGE_TYPES.SERVER_MESSAGE:
          this.addMessage(msg.user, msg.text);
          break;
        case MESSAGE_TYPES.USER_JOIN:
          this.addStateChange(msg.user.handle + ' joined the room.');
          this.users.push(msg.user);
          this.refreshUserList();
          break;
        case MESSAGE_TYPES.USER_LEAVE:
          this.addStateChange(msg.user.handle + ' left the room.');
          this.users = this.users.filter(u => u.handle !== msg.user.handle);
          this.refreshUserList();
          break;
        default:
          console.log('Unhandled message type: ' + msg.type);
          break;
      }
    }.bind(this);
  }

  bindEvents() {
    // Event handlers
    document.getElementById('message').addEventListener('keydown', e => {
      switch (e.keyCode) {
        case 13:
          e.preventDefault(); e.stopPropagation();
          let text = document.getElementById('message').value.trim();
          if (text !== '') {
            this.conn.send(JSON.stringify({
              type: MESSAGE_TYPES.CLIENT_MESSAGE,
              userID: this.id,
              text: text
            }));
          }
          e.target.value = '';
          break;
      }
    });
  }

  scrollToBottom() {
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  addStateChange(text) {
    let msgEl = document.createElement('li');
    msgEl.innerHTML = '<em>' + text + '</em>';
    this.messageList.appendChild(msgEl);
    this.scrollToBottom();
  }

  addMessage(user, text) {
    let msgEl = document.createElement('li');
    msgEl.innerText = '[' + user.handle + '] ' + text;
    this.messageList.appendChild(msgEl);
    this.scrollToBottom();
  }

  refreshUserList() {
    this.userList.innerHTML = '';
    let elements = this.users.map(u => {
      let e = document.createElement('li');
      e.innerText = '[' + u.handle + ']';
      this.userList.appendChild(e);
    });
  }
}

