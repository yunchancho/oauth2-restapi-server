var passport = require('passport');
var Strategy = require('passport-github').Strategy;
var User = require(__appbase_dirname + '/models/model-user');
var githubInfo = require(__appbase_dirname + '/routes/oauth-info').github;

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setRouter = function (router) {
    // login (authenticate)
    router.get('/auth/login/github', passport.authenticate('github'));

    router.get('/auth/login/github/callback',
            passport.authenticate('github', {
                successRedirect: '/profile',
                failureRedirect: '/auth/login/github',
                failureFlash: true
            })
    );

    // connect to current session
    router.get('/auth/connect/github', passport.authorize('github'));

    // disconnect from current session
    router.get('/auth/disconnect/github',
            function (req, res) {
                console.log('disconnect github');
                if (!req.user) {
                    res.redirect('/auth/login');
                } else {
                    var user = req.user;
                    user.github = undefined;
                    console.log('github info: ' + req.user.github);
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

                console.log(changedUser.github);
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
