var passport = require('passport');
var Strategy = require('passport-google-oauth').OAuth2Strategy;
var tokenizer = require('./utils/tokenizer');
var User = require(__appbase_dirname + '/models/model-user');
var googleInfo = require('./utils/oauth-info').google;

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setRouter = function (router) {
    // login (authenticate)
    router.get('/auth/login/google',
            passport.authenticate('google', {
                scope : 'profile email'
            })
    );

    router.get('/auth/login/google/callback',
            passport.authenticate('google', {
                successRedirect: '/auth/login/google/callback/success',
                failureRedirect: '/auth/login/google/callback/failure'
            })
    );

    router.get('/auth/login/google/callback/:state', function (req, res) {
        if (req.params.state == 'success') {
            res.render('auth_popup', {
                state: 'success',
                data: req.user.access_token
            });
        } else {
            res.render('auth_popup', { 
                state: 'failure', 
                data: {
                    message: "Google+ authentication failed :("
                }
            });
        }
    });

    // connect to current session
    router.get('/auth/connect/google',
            passport.authorize('google', {
                scope : 'email'
            })
    );

    // disconnect from current session
    router.get('/auth/disconnect/google',
            function (req, res) {
                console.log('disconnect google');
                if (!req.user) {
                    res.send(401, { reason: 'not-authenticated' });
                } else {
                    var user = req.user;
                    user.google = undefined;
                    console.log('google info: ' + req.user.google);
                    user.save(function (err) {
                        if (err) {
                            console.error(err);
                        }
                        res.json({ token: user.access_token });
                    });
                }
    });
};

var setPassportStrategy = function () {
    passport.use(new Strategy({
        clientID: googleInfo.clientId,
        clientSecret: googleInfo.clientSecret,
        callbackURL: googleInfo.callbackURL,
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {
        // TODO How about using process.nextTick() for code below
        User.findOne({ 'google.id' : profile.id },
            function (err, user) {
                if (err) {
                    console.error(err);
                    return done(err);
                }

                if (user) {
                    console.log('google user already exists!');
                    return done(null, user);
                }

                var changedUser;
                if (req.user) {
                    console.log('already logined user!');
                    changedUser = req.user;
                } else {
                    console.log('not yet logined user!');
                    changedUser = new User();
                    try {
                        changedUser.access_token =
                             tokenizer.create(changedUser._id);
                    } catch(err) {
                        // TODO need to handle error properly
                        console.log(err);
                    }
                }

                // append google profile
                changedUser.google.id = profile.id;
                changedUser.google.token = token;
                changedUser.google.refreshToken = refreshToken;
                changedUser.google.displayName = profile.displayName;
                changedUser.google.email = profile.emails[0].value;
                changedUser.google.photo = profile._json.picture;

                changedUser.save(function (err) {
                    if (err) {
                        console.error(err);
                        return done(err);
                    }
                    return done(null, changedUser);
                });
            }
        );
    }));
};

module.exports = initialize;
