var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy; 
var PublicClientStrategy = require('passport-oauth2-public-client').Strategy;
var OauthClient = require(__appbase_dirname + '/models/model-oauthclient');
var oauth2orize = require('oauth2orize');
var oauth2Server = require('./oauth2-server');
var oauth2TestClients = require('./oauth2-test-clients');
var predefine = require('./predefine');
var url = require('url');
var querystring = require('querystring');

var initialize = function (router) {
    oauth2Server.initialize();
    oauth2TestClients();
    setPassportStrategy();
    setRouter(router);
};

var setPassportStrategy = function () {
    // our oauth server recieves client credentials for only two grant types. 
    //  * Authorization Code grant type
    //  * Client Credential grant type
    // because this request will be done by backend server of 3rd party app which can keep client secret securely.
    // To get access token, backend server of 3rd party app must request grant based on 'Authorization Basic' of http header which include client id and secret
    passport.use(new BasicStrategy({
        passReqToCallback: true
    }, function (req, clientId, clientSecret, done) {
        console.log('enter basic strategy');
        if (req.body.grant_type !==
            predefine.oauth2.type.authorizationCode.name) {
            var error = new oauth2orize.TokenError(
                'This client cannot be used for ' + req.body.grant_type,
                'unsupported_grant_type');
            return done(error);
        }

        // validate client credential
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
            if (oauthClient.grantType[0] !== req.body.grant_type) {
                done(new oauth2orize.TokenError(
                    'This client cannot be used for ' + req.body.grant_type,
                    'unsupported_grant_type'));
            }
            return done(null, oauthClient);
        });
    }));

    passport.use(new PublicClientStrategy({
        passReqToCallback: true
    }, function (req, clientId, done) {
        console.log('enter public client strategy');
        switch (req.body.grant_type) {
            case predefine.oauth2.type.password.name:
            case predefine.oauth2.type.clientCredentials.name:
                OauthClient.findOne({
                    clientId: req.body.client_id 
                }, function (err, oauthClient) {
                    if (err) {
                        return done(new oauth2orize.TokenError(
                            'Error occurs during finding client',
                            'server_error'));
                    }

                    if (!oauthClient) {
                        return done(new oauth2orize.TokenError(
                            'This client does not exist',
                            'invalid_client'));
                    }

                    if (oauthClient.grantType[0] !== req.body.grant_type) {
                        return done(new oauth2orize.TokenError(
                            'This client cannot be used for ' + req.body.grant_type,
                            'unsupported_grant_type'));
                    }
                    // if there is no error, oauth2 processing is continued
                    return done(null, oauthClient);
                });
                break;
            default:
                // this error will be handled by oauth2orize
                var error = new oauth2orize.TokenError(
                        req.body.grant_type + ' type is not supported',
                        'unsupported_grant_type');
                return done(err);
        }
    }));

};

var setRouter = function (router) {
    // Just for authorization code, implicit grant type
    router.get('/auth/authorize', isLogined, oauth2Server.authorize());
    router.post('/auth/authorize/decision', isLogined, oauth2Server.decision());

    // Just for authorization code, Resource owner password, client credential grant type
    router.post('/auth/token',
            passport.authenticate(
                ['basic', 'oauth2-public-client'],
                { session : false }),
            oauth2Server.token());

    // TODO in real practice, this route should be removed!!
    // this is just for test of dummy 3rd party app
    // if there is no error, this 3rd party app server should exchange token using received code
    // otherwise, 3rd party app server should handle error along to error type
    // (we just print received code here)
    router.get('/auth/authorize/callback', function (req, res) {
        console.log('Redirected by authorization server');
        var ret = {};
        if (req.query.code) {
            ret.code = req.query.code; 
            ret.state = req.query.state; 
        } else if (req.query.access_token) {
            ret.access_token = req.query.access_token;
            ret.refresh_token = req.query.refresh_token;
            ret.expires_in = req.query.expires_in;
            ret.scope = req.query.scope;
            ret.state = req.query.state;
            ret.token_type = req.query.token_type;
        } else if (req.query.error) {
            ret.error = req.query.error;
            ret.error_description = req.query.error_description;
            ret.error_uri = req.query.error_uri;
        } else {
            console.log('invalid callback');
        }
        console.log('req url: ' + req.originalUrl);
        // this sending is not meaningful, just for finishing response
        res.json(ret);
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
