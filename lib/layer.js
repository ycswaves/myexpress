var p2re = require("path-to-regexp");


module.exports = function(path, handle){
  this.path = path.replace(/\/$/,'');
  this.handle = handle;
  this.match = function(pathName){
    var names = []
      , re = p2re(this.path,names,{end: false});
    pathName = pathName.replace(/\/$/,'');
    if(re.test(pathName)){
      var m = re.exec(pathName)
        , params = {};

      for(var i=0; i<names.length; i++){
        params[names[i].name] = decodeURIComponent(m[i+1]);
      }
      return {'path':m[0], 'params':params};
    }
    else{
      return undefined;
    }

  }
}