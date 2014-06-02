var express = require('express');
var passport = require('passport');
var socialStrategy = require('./social-strategy');
var User = require(__appbase_dirname + '/models/model-user');

var initialize = function (app) {
    setPassport();
    setApiRoutes(app);
};

var setPassport = function () {
    // initialize passport 
    passport.serializeUser(function (user, done) {
        //console.log('Serialization: ' + user);
        done(null, user.id);
    });
    passport.deserializeUser(function (id, done) {
        //console.log('Deserialization: ' + id);
        User.findById(id, function (err, user) {
            //console.log(user);
            done(err, user);
        });
    });

    socialStrategy.initialize();
};

var setApiRoutes = function (router) {
    require('./api/local-login')(router);
    require('./api/social-login')(router);
    require('./api/connect')(router);
    require('./api/profile')(router);
    require('./api/wish')(router);
};

module.exports.initialize = initialize;
