var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var User = require(__appbase_dirname + '/models/model-user');
var twitterInfo = require('../utils/oauth-info').twitter;

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setRouter = function (router) {
    // login (authenticate)
    router.get('/auth/login/twitter',
            function (req, res, next) {
                console.log('session: ' + JSON.stringify(req.session));
                next();
            },
            passport.authenticate('twitter', {
                scope : 'email'
            })
    );

    router.get('/auth/login/twitter/callback',
            function (req, res, next) {
                console.log('session: ' + JSON.stringify(req.session));
                next();
            },
            passport.authenticate('twitter', {
                successRedirect: '/auth/login/twitter/callback/success',
                failureRedirect: '/auth/login/twitter/callback/failure'
            })
    );

    router.get('/auth/login/twitter/callback/:state', function (req, res) {
        console.log('session: ' + JSON.stringify(req.session));
        var calltype = 'login';
        if (req.session.passport.connect) {
            console.log('this oauth is for connect, not login');
            calltype = 'connect';
        }

        if (req.params.state == 'success') {
            res.render('extenral_account_oauth', {
                type: calltype,
                state: 'success',
                // this value is used for my frontend to get access token 
                data: {
                    name: 'twitter',
                    token: req.user.twitter.token
                }
            });
        } else {
            res.render('extenral_account_oauth', { 
                type: calltype,
                state: 'failure', 
                data: {
                    message: "Twitter Authentication failed :("
                }
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
        console.log('twitter stragtegy');
        // TODO How about using process.nextTick() for code below
        User.findOne({ 'twitter.id' : profile.id },
            function (err, user) {
                if (err) {
                    console.error(err);
                    return done(err);
                }

                // TODO in case of connect, how to handle this?
                if (user) {
                    console.log('twitter user already exists!');
                    return done(null, user);
                }

                var changedUser;
                if (req.user) {
                    changedUser = req.user;
                    changedUser.tokenInfo = undefined;
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
