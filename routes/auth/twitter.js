var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var tokenizer = require('./utils/tokenizer');
var User = require(__appbase_dirname + '/models/model-user');
var twitterInfo = require('./utils/oauth-info').twitter;

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setRouter = function (router) {
    // login (authenticate)
    router.get('/auth/login/twitter',
            passport.authenticate('twitter', {
                scope : 'email'
            })
    );

    router.get('/auth/login/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect: '/auth/login/twitter/callback/success',
                failureRedirect: '/auth/login/twitter/callback/failure'
            })
    );

    router.get('/auth/login/twitter/callback/:state', function (req, res) {
        if (req.params.state == 'success') {
            console.log('succss: ' + req.user.access_token);
            res.render('auth_popup', {
                state: 'success',
                data: req.user.access_token
            });
        } else {
            res.render('auth_popup', { 
                state: 'failure', 
                data: {
                    message: "Twitter Authentication failed :("
                }
            });
        }
    });

    // connect to current session
    router.get('/auth/connect/twitter',
            passport.authorize('twitter', {
                scope : 'email'
            })
    );

    // TODO WHY can't define one more as url callback for oauth?
    /*
    router.get('/auth/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect: '/profile',
                failureRedirect: '/auth/connect/twitter',
                failureFlash: true
            })
    );
    */

    // disconnect from current session
    router.get('/auth/disconnect/twitter',
            function (req, res) {
                console.log('disconnect twitter');
                if (!req.user) {
                    res.send(401, { reason: 'not-authenticated' });
                } else {
                    var user = req.user;
                    user.twitter = undefined;
                    console.log('twitter info: ' + req.user.twitter);
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
        consumerKey: twitterInfo.consumerKey,
        consumerSecret: twitterInfo.consumerSecret,
        callbackURL: twitterInfo.callbackURL,
        passReqToCallback: true
    }, function (req, token, tokenSecret, profile, done) {
        // TODO How about using process.nextTick() for code below
        User.findOne({ 'twitter.id' : profile.id },
            function (err, user) {
                if (err) {
                    console.error(err);
                    return done(err);
                }

                if (user) {
                    console.log('twitter user already exists!');
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

                // append twitter profile
                changedUser.twitter.id = profile.id;
                changedUser.twitter.token = token;
                changedUser.twitter.tokenSecret = tokenSecret;
                changedUser.twitter.displayName = profile.displayName;
                changedUser.twitter.photo = profile.photos[0].value;

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
