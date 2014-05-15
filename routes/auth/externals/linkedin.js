var passport = require('passport');
var Strategy = require('passport-linkedin-oauth2').Strategy;
var User = require(__appbase_dirname + '/models/model-user');
var linkedinInfo = require('../utils/oauth-info').linkedin;

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setRouter = function (router) {
    // login (authenticate)
    router.get('/auth/login/linkedin',
            passport.authenticate('linkedin', { state: 'aZae0AD' }));

    router.get('/auth/login/linkedin/callback',
            passport.authenticate('linkedin', {
                successRedirect: '/auth/login/linkedin/callback/success',
                failureRedirect: '/auth/login/linkedin/callback/failure'
            })
    );

    router.get('/auth/login/linkedin/callback/:state', function (req, res) {
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
                    name: 'linkedin',
                    token: req.user.linkedin.token
                }
            });
        } else {
            res.render('extenral_account_oauth', { 
                type: calltype,
                state: 'failure', 
                data: {
                    message: "LinkedIn authentication failed :("
                }
            });
        }
    });
};

var setPassportStrategy = function () {
    passport.use(new Strategy({
        clientID: linkedinInfo.apiKey,
        clientSecret: linkedinInfo.secretKey,
        callbackURL: linkedinInfo.callbackURL,
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {
        // TODO How about using process.nextTick() for code below
        User.findOne({ 'linkedin.id' : profile.id },
            function (err, user) {
                if (err) {
                    console.error(err);
                    return done(err);
                }

                if (user) {
                    console.log('linkedin user already exists!');
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

                // append linkedin profile
                changedUser.linkedin.id = profile.id;
                changedUser.linkedin.token = token;
                changedUser.linkedin.refreshToken = refreshToken;
                changedUser.linkedin.displayName = profile.displayName;
                changedUser.linkedin.email = profile.emails[0].value;
                changedUser.linkedin.industry = profile._json.industry;
                changedUser.linkedin.headline = profile._json.headline;
                changedUser.linkedin.photo = profile._json.pictureUrl;
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
