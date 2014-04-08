module.exports = function(path, handle){
  this.path = path;
  this.handle = handle;
  this.match = function(pathName){
    if(pathName.indexOf(this.path) == 0){
      return {'path':this.path};
    }
    else{
      return undefined;
    }

  }
}