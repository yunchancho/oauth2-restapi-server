var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy; 
var ClientPasswordStrategy =
        require('passport-oauth2-client-password').Strategy;
var OauthClient = require(__appbase_dirname + '/models/model-oauthclient');
var oauth2orize = require('oauth2orize');
var oauth2Server = require('./oauth2-server');
var oauth2TestClients = require('./oauth2-test-clients');
var url = require('url');
var querystring = require('querystring');

var initialize = function (router) {
    oauth2Server.initialize();
    oauth2TestClients();
    setPassportStrategy();
    setRouter(router);
};

// our oauth server recieves client credentials as way of the followings
var setPassportStrategy = function () {
    // passport setting
    passport.use(new BasicStrategy(function (clientId, clientSecret, done) {
        OauthClient.findOne({
            clientId: clientId,
            clientSecret: clientSecret
        }, function (err, oauthClient) {
            if (err) {
                var error = new oauth2orize.TokenError(
                    'server error during validating client credential',
                    'server_error');
                return done(error);
            }
            if (oauthClient === null) {
                // this error will be handled by oauth2orize
                var error = new oauth2orize.TokenError(
                    'Client authentication failed',
                    'invalid_client');
                return done(error);
            }
            return done(null, oauthClient);
        });
    }));

    passport.use(new ClientPasswordStrategy(function (clientId, clientSecret, done) {
        OauthClient.findOne({
            clientId: clientId,
            clientSecret: clientSecret
        }, function (err, oauthClient) {
            if (err) {
                return done(new oauth2orize.TokenError(
                        'server error during validating client credential',
                        'server_error'
                ));
            }
            if (oauthClient === null) {
                return done(new oauth2orize.TokenError(
                        'Client authentication failed',
                        'invalid_client'
                ));
            }
            return done(null, oauthClient);
        });
    }));
};

var setRouter = function (router) {
    router.get('/auth/authorize', isLogined, oauth2Server.authorize());
    router.post('/auth/authorize/decision', isLogined, oauth2Server.decision());
    router.post('/auth/token',
            passport.authenticate([
                'basic', 
                'oauth2-client-password'
            ], { session : false }), oauth2Server.token());

    // TODO in real practice, this route should be removed!!
    // this is just for test of dummy 3rd party app
    // if there is no error, this 3rd party app server should exchange token using received code
    // otherwise, 3rd party app server should handle error along to error type
    // (we just print received code here)
    router.get('/auth/authorize/callback', function (req, res) {
        console.log('Redirected by authorization server');
        if (req.query.code) {
            console.log('code: ' + req.query.code);
            console.log('state: ' + req.query.state);
        } else if (req.query.error) {
            console.log('error: ' + req.query.error);
            console.log('error_description: ' + req.query.error_description);
            console.log('error_uri: ' + req.query.error_uri);
            console.log('state: ' + req.query.state);
        }
        // this sending is not meaningful, just for finishing response
        res.send(200);
    });
};

var isLogined = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    // this error will be handled by oauth2orize
    var error = new oauth2orize.TokenError(
            'authorization server denied this request',
            'access_denied');
    return next(error);
};

module.exports = initialize;
