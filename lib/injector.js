module.exports= function(handler, app){
  var injector = function(req, res, next){
    var loader = injector.dependencies_loader(req, res, next);
    loader(function(err, value){
      console.log(err);
      console.log(value);
    })
  }
  injector.extract_params = function(){
    return exports.getParameters(handler);
  }

  injector.dependencies_loader = function(req, res, outerNext){
    var results = []
      , error = undefined
      , handlerParams = this.extract_params();

    for (var i = 0; i < handlerParams.length; i++) {
      fName = handlerParams[i];
      try{
        if(app._factories[fName] == undefined){
          error = new Error("Factory not defined: "+fName);
        }
        else{
          app._factories[fName](req, res, next);
        }
      } catch (e){
        error = e;
      }
    };

    function next(err, value){
      if(err instanceof Error){
        error = err;
      }
      results.push(value);
    };

    // builtin dependencies
    if(outerNext != undefined){
      results.push(outerNext);
    }
    if(req != undefined){
      results.push(req);
    }
    if(res != undefined){
      results.push(res);
    }


    var loader = function(fn){
      fn(error, results);
    }
    return loader;
  }

  return injector;
}

exports.getParameters = function (fn) {
  var fnText = fn.toString();
  if (exports.getParameters.cache[fnText]) {
    return exports.getParameters.cache[fnText];
  }

  var FN_ARGS        = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
      FN_ARG_SPLIT   = /,/,
      FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/,
      STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

  var inject = [];
  var argDecl = fnText.replace(STRIP_COMMENTS, '').match(FN_ARGS);
  argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
    arg.replace(FN_ARG, function(all, underscore, name) {
      inject.push(name);
    });
  });

  exports.getParameters.cache[fn] = inject;
  return inject;
};

exports.getParameters.cache = {};