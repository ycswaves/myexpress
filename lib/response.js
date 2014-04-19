var proto = {}
  , http = require('http')
  , mime = require('mime')
  , accepts = require('accepts')
  , crc32 = require('buffer-crc32')
  , fs = require('fs')
  , pathModule = require('path')
  , rparser = require("range-parser");

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

proto.stream = function(file){
  file.pipe(this);
}

proto.sendfile = function(data, opt){
  var res = this
    , range = this.req.headers['range']
    , fileSize;

  res.setHeader('Accept-Range', 'bytes');
  var path = (typeof opt == 'object' && opt.root)? opt.root+data : data;
  path = pathModule.normalize(path);

  // fs.stat(path, function(err, stats){
  //   if(!err){
  //     res.setHeader('Content-Type', 'text/plain');
  //     res.setHeader('Content-Length', stats.size);
  //     fileSize = stats.size;
  //   }
  //   else{
  //     res.statusCode = (path.indexOf('..')>-1)? 403:404;
  //     res.end();
  //   }
  // });

  try{
    var stats = fs.statSync(path);
  } catch (e) {
    res.statusCode = (path.indexOf('..') > -1)?  403 : 404;
    res.end();
    return;
  }

  fileSize = stats.size;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', fileSize);


  var fsOpt = {};

  if(range){
    var r = rparser(fileSize, range);
    if(r == -1){
      res.statusCode = 416;
    }
    else if(r && r[0]){
      fsOpt = r[0];
      var cRange = range.replace(/=/, ' ') + '/' + fileSize;
      res.setHeader('Content-Range', cRange);
      res.statusCode = 206;
    }
  }

  file = fs.createReadStream(path, fsOpt);
  file.on('open', function(){
    res.stream(file);
  });

  file.on('error', function(err) {
    res.statusCode = 403
    res.end();
  });
}

module.exports = proto;