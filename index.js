var http = require('http')
  , Layer = require('lib/layer');

module.exports = function(){

  var myexpress = function(req, res) {
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
            //console.log('match');
            req.params = layer.match(req.url).params;
            if(layer.handle.length === 4){
              next();
            }
            else{
              if(layer.embed){
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

  myexpress.use = function(path, fn){
    if(typeof path.stack !== 'undefined'){ // if 'path' is an app
      for (var i in path.stack ){
        myexpress.stack.push(path.stack[i]);
      }
    }
    else{
      var layerPath;
      if(typeof path === 'function'){// a handler without path
        var layer = new Layer('/', path);
        myexpress.stack.push(layer);
      }
      else{// a handler with path, fn can be a handler or an app
        if(typeof fn.stack !== 'undefined'){ // if fn is an app
          for (var j in fn.stack ){
            fn.stack[j].path = path+fn.stack[j].path;
            fn.stack[j].embed = true;
            myexpress.stack.push(fn.stack[j]);
          }
        }
        else{ // fn is a handler
          layerPath = path;
          var layer = new Layer(layerPath, fn);
          myexpress.stack.push(layer);
        }
      }
    }
  }
  myexpress.handle = myexpress;
  return myexpress;
}
