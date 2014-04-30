var express = require('express');
var passport = require('passport');
var User = require(__appbase_dirname + '/models/model-user');

var initialize = function (app) {
    setRootRoutes(app);
    setAuthRoutes(app);

    //TODO add additional router if you need
};

var setRootRoutes = function (router) {
    router.get('/', isLogined, function (req, res) {
        res.json(req.user);
    });

    router.get('/profile', isLogined, function (req, res) {
        res.json(req.user);
    });
};

var setAuthRoutes = function (router) {

    // initialize passport 
    passport.serializeUser(function (user, done) {
        console.log('Serialization: ' + user);
        done(null, user.id);
    });
    passport.deserializeUser(function (id, done) {
        console.log('Deserialization: ' + id);
        User.findById(id, function (err, user) {
            console.log(user);
            done(err, user);
        });
    });

    require('./auth/local')(router);
    require('./auth/twitter')(router);
    require('./auth/facebook')(router);
    require('./auth/google')(router);
    require('./auth/yahoo')(router);
    require('./auth/linkedin')(router);
    require('./auth/github')(router);
};

var isLogined = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.json(401, { reason: 'not-authenticated' });
};

var redirectHttps = function (req, res, next) {
    if (!req.secure) {
        console.log('redirect secure http server');
        return res.redirect('https://' + req.host + ':3443' + req.url);
    }
    next();
}

module.exports.initialize = initialize;
module.exports.redirectHttps = redirectHttps;
