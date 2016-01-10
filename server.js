#!/bin/env node

var express = require('express');
var fs = require('fs');
var mongodb = require('mongodb');
var path = require('path');
var favicon = require('serve-favicon');
var less = require('less-middleware');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/admin');
var gallery = require('./routes/gallery');
var members = require('./routes/members');
var events = require('./routes/events');
var collaborate = require('./routes/collaborate');
var opportunities = require('./routes/opportunities');
var api_gal = require('./routes/api.gallery');
var api_events = require('./routes/api.events');
var api_mem = require('./routes/api.members');
var api_main = require('./routes/api.mainpage');
var api_rec = require('./routes/api.recentposts');
var api_cal = require('./routes/api.calender');
var api_auth = require('./routes/api.auth');






var App = function(){

  // Scope

  var self = this;

  // Setup
  
  self.dbServer = new mongodb.Server(process.env.OPENSHIFT_MONGODB_DB_HOST, parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT));
  self.db = new mongodb.Db(process.env.OPENSHIFT_APP_NAME, self.dbServer, {auto_reconnect: true});
  self.dbUser = process.env.OPENSHIFT_MONGODB_DB_USERNAME;
  self.dbPass = process.env.OPENSHIFT_MONGODB_DB_PASSWORD;

  self.ipaddr  = process.env.OPENSHIFT_NODEJS_IP;
  self.port    = parseInt(process.env.OPENSHIFT_NODEJS_PORT) || 8080;

  if (typeof self.ipaddr === "undefined") {
    console.warn('No OPENSHIFT_NODEJS_IP environment variable');
  };

  // Web app logic

  // self.routes = {};
  // self.routes['health'] = function(req, res){ res.send('1'); };

  // self.routes['root'] = function(req, res){
  //   self.db.collection('names').find().toArray(function(err, names) {
  //       res.header("Content-Type:","text/json");
  //       res.end(JSON.stringify(names));
  //   });
  // };

  // Webapp urls
  
 
// view engine setup
self.app.set('views', path.join(__dirname, 'views'));
self.app.set('view engine', 'jade');

self.app.use(favicon(__dirname + '/public/img/favicon.ico'));
self.app.use(logger('dev'));
self.app.use(bodyParser.json());
self.app.use(bodyParser.urlencoded({ extended: false }));
self.app.use(cookieParser());

self.app.use(less('/less', {
  once: true,
  pathRoot: path.join(__dirname, 'public')
}));
self.app.use(express.static(path.join(__dirname, 'public')));
self.app.use('/bower_components',  express.static(__dirname + '/bower_components'));

self.app.use('/', routes);
self.app.use('/admin-login', users);
self.app.use('/gallery', gallery);
self.app.use('/members',members);
self.app.use('/events',events);
self.app.use('/opportunities',opportunities);
self.app.use('/collaborate',collaborate);
self.app.use('/api/gallery',api_gal);
self.app.use('/api/members',api_mem);
self.app.use('/api/events',api_events);
self.app.use('/api/mainpage',api_main);
self.app.use('/api/recentposts',api_rec);
self.app.use('/api/calender',api_cal);
self.app.use('/api/auth',api_auth);

// catch 404 and forward to error handler
self.app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace

if (self.app.get('env') === 'development') {
  self.app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
self.app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


 
  // Logic to open a database connection. We are going to call this outside of app so it is available to all our functions inside.

  self.connectDb = function(callback){
    self.db.open(function(err, db){
      if(err){ throw err };
      self.db.authenticate(self.dbUser, self.dbPass, {authdb: "admin"},  function(err, res){
        if(err){ throw err };
        callback();
      });
    });
  };
  
  //starting the nodejs server with express

  self.startServer = function(){
    self.app.listen(self.port, self.ipaddr, function(){
      console.log('%s: Node server started on %s:%d ...', Date(Date.now()), self.ipaddr, self.port);
    });
  }

  // Destructors

  self.terminator = function(sig) {
    if (typeof sig === "string") {
      console.log('%s: Received %s - terminating Node server ...', Date(Date.now()), sig);
      process.exit(1);
    };
    console.log('%s: Node server stopped.', Date(Date.now()) );
  };

  process.on('exit', function() { self.terminator(); });

  self.terminatorSetup = function(element, index, array) {
    process.on(element, function() { self.terminator(element); });
  };

  ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'].forEach(self.terminatorSetup);

};

//make a new express app
var app = new App();

//call the connectDb function and pass in the start server command
app.connectDb(app.startServer);



