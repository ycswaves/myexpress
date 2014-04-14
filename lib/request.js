var proto = {}
  , http = require('http');
proto.isExpress = true;
proto.__proto__ = http.IncomingMessage.prototype;
module.exports = proto;