var express = require("../index.js")
  , http = require("http")
  , request = require("supertest")
  , expect = require("chai").expect;


describe("app",function() {
  var app = express();
  describe("create http server",function() {
    var server = http.createServer(app);
    it('respond to /foo with 404', function (done){
      request(server).get('/foo').expect(404, done);
    })
  });

  describe("#listen",function() {
    var server = http.createServer(app);
    it('should return an http.Server', function (){
      expect(server).to.be.instanceof(http.Server);
    });

    it('responds to /foo with 404', function (done){
      var server = http.createServer(app)
        , port = 7000;
      server.listen(port, done);
      request("http://localhost:%d", port).get("/foo").expect(404);
    });
  });
});