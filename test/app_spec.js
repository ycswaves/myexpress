var express = require("../")
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

describe(".use", function(){
    var app = express()
      , m1 = function() {}
      , m2 = function() {}
      , stackSize = app.stack.length;

    app.use(m1);
    app.use(m2);

    it('should be able to add middlewares to stack', function(){
      expect(app.stack.length).to.equal(stackSize+2);
    });
  });

describe("calling middleware stack",function() {
  var app;
  beforeEach(function() {
    app = new express();
  });

  it('should be able to call a single middleware', function(done){
    var m1 = function(req,res,next) {
      res.end('hello from m1');
    };
    app.use(m1);
    request(app).get('/').expect('hello from m1').end(done);
  })

  it('should be able to call next() to go to next middleware', function(done){
    var m1 = function(req,res,next) {
      next();
    };
    var m2 = function(req,res,next){
      res.end('hello from m2');
    }
    app.use(m1);
    app.use(m2);
    request(app).get('/').expect('hello from m2').end(done);
  });

  it('should 404 at the end of middleware chain', function(done){
    var m1 = function(req,res,next) {
      next();
    };
    var m2 = function(req,res,next){
      next();
    }
    app.use(m1);
    app.use(m2);
    request(app).get('/').expect(404).end(done);
  });

  it('should 404 if no middleware is added', function(done){
    request(app).get('/').expect(404).end(done);
  });
});


describe('Implement Error Handling', function() {
  var app;
  beforeEach(function() {
    app = new express();
  });

  it('should return 500 for unhandled error', function(done){
    var m1 = function(req,res,next) {
      next(new Error("boom"));
    };
    app.use(m1);
    request(app).get('/').expect(500).end(done);
  });

  it('should return 500 for uncaught error', function(done){
    var m1 = function(req,res,next) {
      throw new Error("boom");
    };
    app.use(m1);
    request(app).get('/').expect(500).end(done);
  });

  it('should skip error handlers when next is called without an error', function(done){
    var m1 = function(req,res,next) {
      next();
    }

    var e1 = function(err,req,res,next) {
      // timeout
    }

    var m2 = function(req,res,next) {
      res.end("m2");
    }
    app.use(m1);
    app.use(e1); // should skip this. will timeout if called.
    app.use(m2);
    request(app).get('/').expect('m2').end(done);
  });

  it('should skip error handlers when next is called without an error', function(done){
    var m1 = function(req,res,next) {
      next();
    }

    var e1 = function(err,req,res,next) {
      // timeout
    }

    var m2 = function(req,res,next) {
      res.end("m2");
    }
    app.use(m1);
    app.use(e1); // should skip this. will timeout if called.
    app.use(m2);
    request(app).get('/').expect('m2').end(done);
  });

  it('should skip normal middlewares if next is called with an error', function(done){
    var m1 = function(req,res,next) {
      next(new Error("boom!"));
    }

    var m2 = function(req,res,next) {
      // timeout
    }

    var e1 = function(err,req,res,next) {
      res.end("e1");
    }

    app.use(m1);
    app.use(m2); // should skip this. will timeout if called.
    app.use(e1);
    request(app).get('/').expect('e1').end(done);
  });

});