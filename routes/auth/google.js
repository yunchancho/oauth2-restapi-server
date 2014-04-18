var passport = require('passport');
var Strategy = require('passport-google-oauth').OAuth2Strategy;
var User = require(__appbase_dirname + '/models/model-user');
var googleInfo = require(__appbase_dirname + '/routes/oauth-info').google;

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
                successRedirect: '/profile',
                failureRedirect: '/auth/login/google',
                failureFlash: true
            })
    );

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
                    res.redirect('/auth/login');
                } else {
                    var user = req.user;
                    user.google = undefined;
                    console.log('google info: ' + req.user.google);
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
