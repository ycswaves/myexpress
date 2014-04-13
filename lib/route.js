var methods = require('methods');
module.exports = function () {

  var route = function (req, res, outerNext){
    next();
    route.stackPointer = 0;
    function next(err){
      var rt = route.stack[route.stackPointer++]
        , method = req.method.toLowerCase();
      if(err == 'route'){
        next();
      }
      else if(!rt || err){
        outerNext(err);
      }
      else if(method != rt.verb && rt.verb != 'all'){
        next();
      }
      else{
        rt.handler(req, res, next);
      }
    }
  }

  route.stack = [];
  route.stackPointer = 0;
  route.isRoute = true;

  methods.concat('all').forEach(function(method){
    route[method] = function(handler){
      route.use(method, handler);
      return route;
    }
  });

  route.use = function(verb, handler){
    route.stack.push({'verb':verb, 'handler': handler});
  };
  return route;
}