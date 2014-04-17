module.exports= function(handler, app){
  var injector = {
    extract_params: function(){
      return exports.getParameters(handler);
    },

    dependencies_loader: function(){
      return function(fn){

      }
    }
  };
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