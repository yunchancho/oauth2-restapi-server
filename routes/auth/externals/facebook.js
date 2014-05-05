var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var tokenizer = require('../utils/tokenizer');
var User = require(__appbase_dirname + '/models/model-user');
var facebookInfo = require('../utils/oauth-info').facebook;

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setRouter = function (router) {
    // login (authenticate)
    router.get('/auth/login/facebook',
            passport.authenticate('facebook', {
                scope : 'email user_birthday'
            })
    );

    router.get('/auth/login/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect: '/auth/login/facebook/callback/success',
                failureRedirect: '/auth/login/facebook/callback/failure'
            })
    );

    router.get('/auth/login/facebook/callback/:state', function (req, res) {
        if (req.params.state == 'success') {
            res.render('extenral_account_oauth', {
                state: 'success',
                data: req.user.access_token
            });
        } else {
            res.render('extenral_account_oauth', { 
                state: 'failure', 
                data: {
                    message: "Facebook authentication failed :("
                }
            });
        }
    });

    // connect to current session
    router.get('/auth/connect/facebook',
            passport.authorize('facebook', {
                scope : 'email'
            })
    );

    // disconnect from current session
    router.get('/auth/disconnect/facebook',
            function (req, res) {
                console.log('disconnect facebook');
                if (!req.user) {
                    res.send(401, { reason: 'not-authenticated' });
                } else {
                    var user = req.user;
                    user.facebook = undefined;
                    console.log('facebook info: ' + req.user.facebook);
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
        clientID: facebookInfo.appId,
        clientSecret: facebookInfo.appSecret,
        callbackURL: facebookInfo.callbackURL,
        //profileFields: ['id', 'displayName', 'photos'],
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {
        // TODO How about using process.nextTick() for code below
        User.findOne({ 'facebook.id' : profile.id },
            function (err, user) {
                if (err) {
                    console.error(err);
                    return done(err);
                }

                if (user) {
                    console.log('facebook user already exists!');
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

                // append facebook profile
                changedUser.facebook.id = profile.id;
                changedUser.facebook.token = token;
                changedUser.facebook.refreshToken = refreshToken;
                changedUser.facebook.displayName = profile.name.familyName + ' ' + profile.name.givenName;
                changedUser.facebook.email = (profile.emails[0].value || '').toLowerCase();
                console.log(changedUser.facebook);
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
