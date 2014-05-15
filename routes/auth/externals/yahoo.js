var passport = require('passport');
var Strategy = require('passport-yahoo-oauth').Strategy;
var User = require(__appbase_dirname + '/models/model-user');
var yahooInfo = require('../utils/oauth-info').yahoo;

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setRouter = function (router) {
    // login (authenticate)
    router.get('/auth/login/yahoo',
            passport.authenticate('yahoo', function (req, res) {
                console.log('yahoo start to authenticate user');
            })
    );

    router.get('/auth/login/yahoo/callback',
            passport.authenticate('yahoo', {
                successRedirect: '/auth/login/yahoo/callback/success',
                failureRedirect: '/auth/login/yahoo/callback/failure'
            })
    );

    router.get('/auth/login/yahoo/callback/:state', function (req, res) {
        var calltype = 'login';
        if (req.session.passport.connect) {
            console.log('this oauth is for connect, not login');
            calltype = 'connect';
        }

        if (req.params.state == 'success') {
            res.render('extenral_account_oauth', {
                type: calltype,
                state: 'success',
                data: {
                    name: 'yahoo',
                    token: req.user.yahoo.token
                }
            });
        } else {
            res.render('extenral_account_oauth', { 
                type: calltype,
                state: 'failure', 
                data: {
                    message: "Yahoo authentication failed :("
                }
            });
        }
    });
};

var setPassportStrategy = function () {
    passport.use(new Strategy({
        consumerKey: yahooInfo.consumerKey,
        consumerSecret: yahooInfo.consumerSecret,
        callbackURL: yahooInfo.callbackURL,
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {
        // TODO How about using process.nextTick() for code below
        User.findOne({ 'yahoo.id' : profile.id },
            function (err, user) {
                if (err) {
                    console.error(err);
                    return done(err);
                }

                if (user) {
                    console.log('yahoo user already exists!');
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

                // append yahoo profile
                changedUser.yahoo.id = profile.id;
                changedUser.yahoo.token = token;
                changedUser.yahoo.refreshToken = refreshToken;
                changedUser.yahoo.displayName = 
                changedUser.yahoo.email = 
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
