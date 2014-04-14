var http = require('http')
  , Layer = require('lib/layer')
  , makeRoute = require('lib/route')
  , methods = require('methods')
  , request = require('lib/request')
  , response = require('lib/response');

module.exports = function(){

  var myexpress = function(req, res) {
    myexpress.monkey_patch(req, res);
    req.app = myexpress;
    next();
    myexpress.stackPointer = 0;


    function next(err){
      layer = myexpress.stack[myexpress.stackPointer++];
      if(!layer){
        if(!err){
          res.statusCode = 404;
          res.end();
          return;
        }
        else{
          res.statusCode = 500;
          res.end();
          return;
        }
      }
      else if(err){
        if(layer.handle.length < 4){
          next(err); //if it's not a error handle middleware, pass down the stack
        }
        else if(layer.match(req.url)){
          layer.handle(err, req, res, next);
        }
        else{
          next(err);
        }
      }
      else{
        try {
          if(layer.match(req.url)){
            req.params = layer.match(req.url).params;
            if(layer.handle.length === 4){
              next();
            }
            else{
              if(layer.embed){
                req.app = layer.app;
                req.url = req.url.replace(/^\/[^\/]*/,''); //trim prefix
              }
              layer.handle(req, res, next);
            }
          }
          else{
            //console.log('no match');
            next();
          }
        } catch(e) {
          //console.log(e);
          next(e);
        }
      }
    } //end of next()
  };

  myexpress.stack = [];
  myexpress.stackPointer = 0;

  myexpress.listen = function(port,callback) {
    return http.createServer(this).listen(port,callback);
  }

  myexpress.route = function(path, handler, method){
    var rt = makeRoute();
    if(handler && method){
      rt.use(method, handler);
    }
    myexpress.use(path, rt);
    return rt;
  }

  myexpress.use = function(path, fn){
    if(typeof path.stack !== 'undefined' && !path.isRoute){ // if 'path' is an app
      for (var i in path.stack ){
        path.stack[i].embed = true;
        path.stack[i].app = path;
        myexpress.stack.push(path.stack[i]);
      }
    }
    else{ // if path is not an app
      var layerPath;
      if(typeof path === 'function'){ // a middleware without path
        var layer = new Layer('/', path);
        myexpress.stack.push(layer);
      }
      else if(path.isRoute){
        var layer = new Layer('/', path, true);
        myexpress.stack.push(layer);
      }
      else{// a handler with path, fn can be a handler/app/route
        if(!fn.isRoute && typeof fn.stack !== 'undefined'){ // if fn is an app
          for (var j in fn.stack ){
            fn.stack[j].path = path+fn.stack[j].path;
            fn.stack[j].embed = true;
            fn.stack[j].app = fn;
            myexpress.stack.push(fn.stack[j]);
          }
        }
        else{ // fn is a handler OR route
          layerPath = path;
          var layer = new Layer(layerPath, fn, fn.isRoute);
          myexpress.stack.push(layer);
        }
      }
    }
  }

  methods.concat('all').forEach(function(method){
    myexpress[method] = function(path, handler){
      myexpress.route(path, handler, method);
      return myexpress;
    }
  });

  myexpress.handle = myexpress;

  myexpress.monkey_patch = function(req,res){
    req.__proto__ = request;
    req.res = res;
    res.__proto__ = response;
    res.req = req;
  }
  return myexpress;
}
