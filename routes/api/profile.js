var passport = require('passport');
var tokenizer = require('../auth/utils/tokenizer');
var oauth2Server = require('../auth/oauth2-server');

var initialize = function (router) {
    setRouter(router);
};

var setRouter = function (router) {
    router.get('/api/profile',
            passport.authenticate('bearer', { session: false }),
            oauth2Server.error(),
            function (req, res) {
                console.log('send profile after checking authorization');
                res.json(req.user);
            });
};

module.exports = initialize;
