var passport = require('passport');
var Strategy = require('passport-http-bearer').Strategy;
var tokenizer = require('../auth/utils/tokenizer');
var User = require(__appbase_dirname + '/models/model-user');

var initialize = function (router) {
    setPassportStrategy();
    setRouter(router);
};

var setPassportStrategy = function () {
    passport.use(new Strategy({
        passReqToCallback: true
    }, function (req, token, done) {
        tokenizer.validate(token, req.param('id'), function (err) {
            if (err) {
                done(err);
            }

            User.findOne({
                '_id': req.param('id')
            }, function (err, user) {
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
        });
    }));
};

var setRouter = function (router) {
    router.get('/api/profile/:id', passport.authenticate('bearer', {
        session: false 
    }), function (req, res) {
        console.log('send profile after checking authorization');
        res.json(req.user);
    });
};

module.exports = initialize;
