var passport = require('passport');
var Strategy = require('passport-http-bearer').Strategy;
var tokenizer = require('../auth/utils/tokenizer');
var User = require(__appbase_dirname + '/models/model-user');

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setPassportStrategy = function () {
    passport.use(new Strategy(function (token, done) {
        var resolved;
        try {
            resolved = tokenizer.resolve(token);
        } catch(err) {
            return done(null, false, {
                reason: 'invalid-access-token'
            });
        }
        User.findOne({ '_id': resolved.iss }, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    reason: 'invalid-user'
                });
            }
            // TODO define scope for detail authorization
            return done(null, user, { scope: 'read' });
        });
    }));
};

var setRouter = function (router) {
    router.get('/api/profile', passport.authenticate('bearer', {
        session: false 
    }), function (req, res) {
        console.log('send profile after checking authorization');
        res.json(req.user);
    });
};

module.exports = initialize;
