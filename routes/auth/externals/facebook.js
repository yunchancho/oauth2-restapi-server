var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
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
                    name: 'facebook',
                    token: req.user.facebook.token
                }
            });
        } else {
            res.render('extenral_account_oauth', { 
                type: calltype,
                state: 'failure', 
                data: {
                    message: "Facebook authentication failed :("
                }
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
                }

                // append facebook profile
                changedUser.facebook.id = profile.id;
                changedUser.facebook.token = token;
                changedUser.facebook.refreshToken = refreshToken;
                changedUser.facebook.displayName = profile.name.familyName + ' ' + profile.name.givenName;
                changedUser.facebook.email = (profile.emails[0].value || '').toLowerCase();
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
