var express = require('express');
var User = require(__appbase_dirname + '/models/model-user');

var initialize = function (app, passport) {
    setRootRoutes(app);

    // add router for /auth route
    //var router = express.Router();
    //app.use('/auth', router);
    setAuthRoutes(app, passport);

    // add routers for other resources
    //app.use('/user', app.Router());
    //app.use('/something', app.Router());
};

var setRootRoutes = function (router) {
    router.get('/', isLogined, function (req, res) {
        res.render('profile.ejs', { user: req.user });
    });

    router.get('/profile', isLogined, function (req, res) {
        res.render('profile.ejs', { user: req.user });
    });
};

var setAuthRoutes = function (router, passport) {

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

    require('./auth/local')(router, passport);
    require('./auth/twitter')(router, passport);
    require('./auth/facebook')(router, passport);
    require('./auth/google')(router, passport);
    //require('./auth/yahoo')(router, passport);
    //require('./auth/linkedin')(router, passport);
    //require('./auth/github')(router, passport);
};

var isLogined = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
};

module.exports = initialize;
