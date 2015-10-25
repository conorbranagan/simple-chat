// Shared client and server constants.

root = exports ? exports : window;

root.MESSAGE_TYPE = {
  SERVER_JOIN: 'server_join',
  SET_USER: 'set_user',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  CLIENT_MESSAGE: 'client_message',
  SERVER_MESSAGE: 'server_message'
}
