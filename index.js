var http = require('http')
  , Layer = require('lib/layer');

module.exports = function(){

  var myexpress = function(req, res) {
    next();

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
        else{
          layer.handle(err, req, res, next);
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
              layer.handle(req, res, next);
              myexpress.stackPointer = 0;
            }
          }
          else{
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
    if(typeof path.stack !== 'undefined'){
      for (var i in path.stack ){
        myexpress.stack.push(path.stack[i]);
      }
    }
    else{
      var layerPath;
      if(typeof path === 'function'){
        layerPath = '/';
        fn = path;
      }
      else{
        layerPath = path;
      }
      var layer = new Layer(layerPath, fn);
      myexpress.stack.push(layer);
    }
  }
  return myexpress;
}
