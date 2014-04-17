var proto = {}
  , http = require('http')
  , mime = require('mime')
  , accepts = require('accepts')
  , crc32 = require('buffer-crc32');;
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
proto.send = function(code, body){
  var msg, httpCode;

  // handle specified status code
  if(typeof code == 'number' && typeof body == 'string'){
    httpCode = code;
    msg = body;
  }
  else if(typeof code == 'number'){
    httpCode = code;
    msg = http.STATUS_CODES[httpCode];
  }
  else if(Buffer.isBuffer(code)){
    msg = code;
    httpCode = 200;
    this.type('bin');
    this.setHeader('Content-Length', msg.length);
  }
  else if(typeof code == 'object'){
    msg = JSON.stringify(code);
    httpCode = 200;
    this.type('json');
  }
  else{
    msg = code;
    httpCode = 200;
  }


  if (this.getHeader('Content-Length') == undefined){
    this.setHeader('Content-Length',Buffer.byteLength(msg));
  }

  if(this.getHeader('content-type') == undefined){
    this.type('html');
  }

  // conditional get - ETag
  if(this.getHeader('ETag') != undefined){
    httpCode = (this.getHeader('ETag') == this.req.headers["if-none-match"])?
                304 : httpCode;
  }
  else if(this.getHeader('Last-Modified') != undefined){
    httpCode = (this.getHeader('Last-Modified') <= this.req.headers["if-modified-since"])?
                304 : httpCode;
  }
  else if(this.req.method == 'GET' && msg.length>0){
    this.setHeader('ETag', '"'+crc32.unsigned(msg)+'"');
  }

  this.statusCode = httpCode;
  this.write(msg);
  this.end();
}
module.exports = proto;