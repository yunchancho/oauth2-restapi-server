var Strategy = require('passport-facebook').Strategy;
var User = require(__appbase_dirname + '/models/model-user');
var facebookInfo = require(__appbase_dirname + '/routes/oauth-info').facebook;

var initialize = function (router, passport) {
    setPassportStrategy(passport);
    setRouter(router, passport);
};

var setRouter = function (router, passport) {
    // login (authenticate)
    router.get('/auth/login/facebook',
            passport.authenticate('facebook', {
                scope : 'email user_birthday'
            })
    );

    router.get('/auth/login/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect: '/profile',
                failureRedirect: '/auth/login/facebook',
                failureFlash: true
            })
    );

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
                    res.redirect('/auth/login');
                } else {
                    var user = req.user;
                    user.facebook = undefined;
                    console.log('facebook info: ' + req.user.facebook);
                    user.save(function (err) {
                        if (err) {
                            console.error(err);
                        }
                    });
                    res.redirect('/profile');
                }
    });
};

var setPassportStrategy = function (passport) {
    passport.use(new Strategy({
        clientID: facebookInfo.appId,
        clientSecret: facebookInfo.appSecret,
        callbackURL: facebookInfo.callbackURL,
        //profileFields: ['id', 'displayName', 'photos'],
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {
        console.log('-----');
        console.log(profile);
        console.log('-----');
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
