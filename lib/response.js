var proto = {}
  , http = require('http')
  , mime = require('mime')
  , accepts = require('accepts');
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

proto.type = function(ext){
  this.setHeader('Content-Type', mime.lookup(ext));
}
proto.default_type = function(ext){
  this.setHeader('Content-Type', mime.lookup('txt'));
}
proto.format = function(obj){
  var accept = accepts(this.req);
  var acceptFormat = accept.types(Object.keys(obj));
  try{
    if(acceptFormat.length == 0){
      var err = new Error('Not Acceptable');
      err.statusCode = 406;
      throw err;
    }
    else{
      this.setHeader('Accept', acceptFormat);
      this.type(acceptFormat);
      obj[acceptFormat]();
    }
  } catch (err) {
    this.statusCode = err.statusCode;
    this.end();
  }
}
module.exports = proto;