var Strategy = require('passport-local').Strategy;
var User = require(__appbase_dirname + '/models/model-user');

var initialize = function (router, passport) {
    setPassportStrategy(passport);
    setRouter(router, passport);
};

var setRouter = function (router, passport) {
    router.get('/auth', function (req, res) {
        res.redirect('/auth/login');
    });

    // set route for login and its passport
    router.get('/auth/login', function (req, res) {
        if (req.user) {
            res.redirect('/profile');
        }
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    router.post('/auth/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/auth/login',
        failureFlash: true
    }));

    router.get('/auth/logout', function (req, res) {
        if (req.user) {
            req.logout();
        } else {
            console.log('this user is not authenticated');
        }
        res.redirect('/');
    });

    router.get('/auth/connect/local',
            function (req, res) {
                res.render('connect.ejs',
                    { message: req.flash('loginMessage') });
    });

    router.post('/auth/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/auth/connect/local',
        failureFlash: true
    }));

    router.get('/auth/disconnect/local',
            function (req, res) {
                var user = req.user;
                user.local = undefined;
                user.save(function (err) {
                    if (err) {
                        console.error(err);
                    }
                });
                res.redirect('/profile');
    });

    // set route for signup and its passport
    router.get('/auth/signup', function (req, res) {
        if (req.user) {
            res.redirect('/');
        }
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });
    router.post('/auth/signup', function (req, res, next) {
        console.log('signup post middleware function');
        return next();
    }, passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/auth/signup',
        failureFlash: true
    }));
}

var setPassportStrategy = function (passport) {
    // set login strategy
    passport.use('local-login', new Strategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        if (email) {
            email = email.toLowerCase();
        }
        User.findOne({ 'local.email': email }, function (err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false, req.flash('loginMessage', 'Invaild user.'));
            }

            if (!user.validPassword(password)) {
                return done(null, false, req.flash('loginMessage', 'Invalid password.'));
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
        console.log('signup verify callback');
        if (email) {
            email = email.toLowerCase();
        }

        process.nextTick(function() {
            if (!req.user) {
                console.log('!req.user');
                User.findOne({ 'local.email': email },
                    function (err, user) {
                        if (err) {
                            return done(err);
                        }

                        if (user) {
                            return done(null, false,
                                req.flash('signupMessage', 'That email is already registered.')); 
                        }
                        var user = new User();
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        user.save(function (err) {
                            if (err) {
                                throw err;
                            }
                            return done(null, user);
                        });
                });
            } else if (!req.user.local.email) {
                console.log('!req.user.local');
                var user = req.user;
                user.local.email = email;
                user.local.password = user.generateHash(password);
                user.save(function (err) {
                    if (err) {
                        throw err;
                    }
                    return done(null, user);
                });
            } else {
                return done(null, req.user);
            }
        });
    }));
};

module.exports = initialize;
