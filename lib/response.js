var proto = {}
  , http = require('http');
proto.isExpress = true;
proto.__proto__ = http.ServerResponse.prototype;
proto.redirect = function(arg1, arg2){
  var httpCode, redirectPath;
  if(arg2){
    httpCode = arg1;
    redirectPath = arg2;
  }
  else{
    httpCode = 302;
    redirectPath = arg1;
  }

  this.writeHead(httpCode,{
    'Location': redirectPath,
    'Content-Length': 0
  });
  this.end();
}
module.exports = proto;