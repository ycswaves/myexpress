var http = require('http');

module.exports = function(){

  var myexpress = function(req, res) {

    var stackSize = myexpress.stack.length;

    function next(err){
      myexpress.stackPointer++;
      if(myexpress.stackPointer >= stackSize
         && !err){ //handle end of middleware chain
        res.statusCode = 404;
        res.end();
      }

      if(err){

        if(myexpress.stack[myexpress.stackPointer].length < 4){
          next(err); //if it's not a error handle middleware, pass down the stack
        }
        else if(myexpress.stackPointer < stackSize){
          //if a error handle middleware is available
          myexpress.stack[myexpress.stackPointer](err,req, res, next);
        }
        else{
          res.statusCode = 500;
          res.end();
        }
      }
      else{
        if(myexpress.stack[myexpress.stackPointer].length<4){
          myexpress(req, res);
        }
        else{
          next();
        }
      }
    } //end of next()


    if( stackSize > 0 && myexpress.stackPointer < stackSize){
      try {
        myexpress.stack[myexpress.stackPointer](req, res, next);
      } catch (e) {
        res.statusCode = 500;
        res.end();
      }
    }
    else{
      res.statusCode = 404;
      res.end();
    }
  };

  myexpress.stack = [];
  myexpress.stackPointer = 0;

  myexpress.listen = function(port,callback) {
    return http.createServer(this).listen(port,callback);
  }

  myexpress.use = function(fn){
    if(typeof fn.stack !== 'undefined'){
      for (var i in fn.stack ){
        myexpress.stack.push(fn.stack[i]);
      }
    }
    else{
      myexpress.stack.push(fn);
    }
  }
  return myexpress;
}
