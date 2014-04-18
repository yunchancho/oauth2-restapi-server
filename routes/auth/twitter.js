var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var User = require(__appbase_dirname + '/models/model-user');
var twitterInfo = require(__appbase_dirname + '/routes/oauth-info').twitter;

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
                successRedirect: '/profile',
                failureRedirect: '/auth/login/twitter',
                failureFlash: true
            })
    );

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
                    res.redirect('/auth/login');
                } else {
                    var user = req.user;
                    user.twitter = undefined;
                    console.log('twitter info: ' + req.user.twitter);
                    user.save(function (err) {
                        if (err) {
                            console.error(err);
                        }
                    });
                    res.redirect('/profile');
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
