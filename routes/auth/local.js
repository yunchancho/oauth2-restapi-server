var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var User = require(__appbase_dirname + '/models/model-user');

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setRouter = function (router) {
    // set route for login and its passport
    // login/out is only used for 3rd app to get grant of OAuth2 authorization
    router.post('/auth/login',  function (req, res, next) {
        passport.authenticate('local-login', { session: true},
            function (err, user, info) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    console.log(info);
                    return res.json(401, info);
                }

                req.login(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.json(200);
                });
        })(req, res, next);
    });


    router.get('/auth/logout', function (req, res) {
        // TODO replace this to token way
        if (req.user) {
            req.logout();
        } else {
            console.log('this user is not authenticated');
        }
        // TODO what do we remove for this request??
        res.send(200);
    });

    // set route for signup and its passport
    router.post('/auth/signup', function (req, res, next) {
        passport.authenticate('local-signup', { session: false },
            function (err, user, info) {
                console.log('success to local-signup passport');
                if (err) {
                    return next(err);
                }
                if (!user) {
                    console.log(info);
                    return res.json(401, info);
                }

                return res.send(200);
            }
        )(req, res, next);
    });
};

var setPassportStrategy = function () {
    // set login strategy
    passport.use('local-login', new Strategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        console.log('passport local login verify callback');
        if (email) {
            email = email.toLowerCase();
        }
        User.findOne({ 'local.email': email }, function (err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false, { reason: 'invalid-email' });
            }

            if (!user.validPassword(password)) {
                return done(null, false, { reason: 'invalid-password' });
            }

            return done(null, user);
        });
    }));

    // set signup strategy
    passport.use('local-signup', new Strategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        console.log('local-signup strategy');
        if (email) {
            email = email.toLowerCase();
        }

        process.nextTick(function() {
            // TODO replace this to token way
            
            if (req.user && req.user.local && req.user.local.email) {
                // in case of invalid access, just return current data
                return done(null, req.user);
            }

            User.findOne({
                'local.email': email 
            }, function (err, user) {
                if (err) {
                    return done(err);
                }

                if (user) {
                    console.log('an user with email exists!'); 
                    return done(null, false, {
                        reason: 'registered-email'
                    }); 
                }

                var user;
                if (!req.user) {
                    user = new User();
                } else if (!req.user.local.email) {
                    user = req.user;
                } 

                user.local.email = email;
                user.local.password = user.generateHash(password);
                user.save(function (err) {
                    if (err) {
                        throw err;
                    }
                    return done(null, user);
                });
            });
        });
    }));
};

module.exports = initialize;
