var passport = require('passport');
var oauth2Server = require('../auth/oauth2-server');
var User = require(__appbase_dirname + '/models/model-user');

module.exports = function(router) {

router.post('/api/connect/local',
        passport.authenticate('bearer', { session: false }),
        oauth2Server.error(),
        function (req, res, next) {
            passport.authenticate('local-signup', { session: false }, 
                function (err, user, info) {
                    if (err) {
                        return next(err);
                    }
                    if (!user) {
                        console.log(info);
                        return res.json(401, info);
                    }

                    return res.send(200);
                }
            )(req, res, next);
        }
);

router.get('/api/disconnect/local', 
        passport.authenticate('bearer', { session: false }),
        oauth2Server.error(),
        function (req, res) {
            console.log('disconnect local');
            process.nextTick(function() {
                // TODO replace this to token way
                User.findOne({
                    'local.email': req.user.local.email
                }, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if (!user) {
                        res.json(401, {
                            reason: 'no-user'
                        }); 
                    }

                    user.local = undefined;
                    user.tokenInfo = undefined;
                    user.save(function (err) {
                        if (err) {
                            throw err;
                        }
                        return res.send(200);
                    });
                });
            });
        }
);

// connect to current session
router.get('/api/connect/:socialapp',
        function (req, res, next) {
            // TODO if social apps require any option except scope,
            // add it here along to social app (e.g. state)
            var scope = null;
            var state = null;
            switch(req.params.socialapp) {
                case 'twitter':
                    scope = 'email';
                    break;
                case 'facebook':
                    scope = 'email';
                    break;
                case 'google':
                    scope = 'email';
                    break;
                case 'yahoo':
                    break;
                case 'linkedin':
                    scope = [ 'r_fullprofile', 'r_emailaddress' ];
                    state = 'aZae0AD'; // dummy value
                    break;
                case 'github':
                    break;
                default:
                    return res.json(400, { reason: 'unknown-socialapp' });
            }
            // this new property will be used in route logic of callback url
            req.session.passport.connect = true;
            passport.authenticate(req.params.socialapp, {
                session: true,
                scope: scope,
                state: state
            })(req, res, next);
        }
);

// disconnect from current session
router.get('/api/disconnect/:socialapp',
        passport.authenticate('bearer', { session: false }),
        oauth2Server.error(),
        function (req, res) {
            var user = req.user;
            switch(req.params.socialapp) {
                case 'twitter':
                    user.twitter = undefined;
                    break;
                case 'facebook':
                    user.facebook = undefined;
                    break;
                case 'google':
                    user.google = undefined;
                    break;
                case 'yahoo':
                    user.yahoo = undefined;
                    break;
                case 'linkedin':
                    user.linkedin = undefined;
                    break;
                case 'github':
                    user.github = undefined;
                    break;
                default:
                    return res.send(401, { reason: 'unknown-socialapp' });
            }
            user.save(function (err) {
                if (err) {
                    console.error(err);
                }
                res.send(200);
            });
        }
);

};

