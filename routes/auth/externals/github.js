var passport = require('passport');
var Strategy = require('passport-github').Strategy;
var User = require(__appbase_dirname + '/models/model-user');
var githubInfo = require('../utils/oauth-info').github;

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setRouter = function (router) {
    // login (authenticate)
    router.get('/auth/login/github', passport.authenticate('github'));

    router.get('/auth/login/github/callback',
            passport.authenticate('github', {
                successRedirect: '/auth/login/github/callback/success',
                failureRedirect: '/auth/login/github/callback/failure'
            })
    );

    router.get('/auth/login/github/callback/:state', function (req, res) {
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
                    name: 'github',
                    token: req.user.github.token
                }
            });
        } else {
            res.render('extenral_account_oauth', { 
                type: calltype,
                state: 'failure', 
                data: {
                    message: "Github authentication failed :("
                }
            });
        }
    });
};

var setPassportStrategy = function () {
    passport.use(new Strategy({
        clientID: githubInfo.clientId,
        clientSecret: githubInfo.clientSecret,
        callbackURL: githubInfo.callbackURL,
        scope: [ 'user', 'repo', 'read:public_key' ],
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {
        // TODO How about using process.nextTick() for code below
        User.findOne({ 'github.id' : profile.id },
            function (err, user) {
                if (err) {
                    console.error(err);
                    return done(err);
                }

                if (user) {
                    console.log('github user already exists!');
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

                // append github profile
                changedUser.github.id = profile.id;
                changedUser.github.token = token;
                changedUser.github.refreshToken = refreshToken;
                changedUser.github.displayName = profile.username;
                changedUser.github.email = profile.emails[0].value;
                changedUser.github.photo = profile._json.avatar_url;
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
