var connect = require('connect');

module.exports = function(){
  var app = connect();
  app.use(function (req, res, next){
    next();
  });
  return app;
}