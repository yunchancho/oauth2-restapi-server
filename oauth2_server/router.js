var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy; 
var PublicClientStrategy = require('passport-oauth2-public-client').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var OauthClient = require(__appbase_dirname + '/models/model-oauthclient');
var Token = require(__appbase_dirname + '/models/model-token');
var User = require(__appbase_dirname + '/models/model-user');
var oauth2orize = require('oauth2orize');
var oauth2Server = require('./server');
var oauth2TestClients = require('./test-clients');
var predefine = require('./predefine');
var tokenizer = require(__appbase_dirname + '/utils/tokenizer');
var url = require('url');
var querystring = require('querystring');

var initialize = function (router) {
    // oauth2 server start to run
    oauth2Server.initialize();
    oauth2TestClients();

    // set routes for oauth2
    setPassportStrategy();
    setRouter(router);
};

var setPassportStrategy = function () {
    // our oauth server recieves client credentials for only two grant types. 
    //  * Authorization Code grant type
    //  * Resource Owner Credentials Password type
    //  * Client Credential grant type
    // because this request will be done by backend server of 3rd party app which can keep client secret securely.
    // To get access token, backend server of 3rd party app must request grant based on 'Authorization Basic' of http header which include client id and secret
    passport.use(new BasicStrategy({
        passReqToCallback: true
    }, function (req, clientId, clientSecret, done) {
        console.log('enter basic strategy');
        if (!req.body.grant_type) {
            var error = new oauth2orize.TokenError(
                'there is no grant_type field in body',
                'invalid_request');
            return done(error);
        }

        switch (req.body.grant_type) {
            case predefine.oauth2.type.authorizationCode.name:
            case predefine.oauth2.type.password.name:
            case predefine.oauth2.type.clientCredentials.name:
                break;
            default:
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

    passport.use(new BearerStrategy({
        passReqToCallback: true
    }, function (req, accessToken, done) {
        console.log('bearer stretegy');
        tokenizer.validate(accessToken, function (err, token) {
            if (err) {
                return done(err);
            }

            User.findOne({
                '_id': token.userId
            }, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {
                        reason: 'invalid-user'
                    });
                }

                // token info can be used for handling REST API
                // so token info is set to result which is returned after authentication 
                user.tokenInfo = token;
                return done(null, user);
            });
        });
    }));
};

var setRouter = function (router) {
    // Just for authorization code, implicit grant type
    router.get('/oauth2/authorize', isLogined, oauth2Server.authorize());
    router.post('/oauth2/authorize/decision', isLogined, oauth2Server.decision());

    // Authenticate client and create access token 
    // 'basic' strategy: 'Authorization Code', 'Client Credential' grant type
    // 'public-client' strategy: 'Implicit', 'Resource owner password' type
    router.post('/oauth2/token', 
            function (req, res, next) {
                console.log('session: ' + JSON.stringify(req.session));
                next();
            },
            passport.authenticate(
                ['basic', 'oauth2-public-client'],
                { session : false }),
            oauth2Server.token());

    // Delete access token for all grant types
    router.del('/oauth2/token',
            passport.authenticate('bearer', { session: false }),
            function (req, res) {
                console.log('bearer strategy for token delete');
                Token.remove({
                    'accessToken': req.user.tokenInfo.accessToken,
                    'userId': req.user._id
                }, function (err) {
                    if (err) {
                        // TODO need to set proper error
                        res.send(400);
                    } else {
                        res.send(200);
                    }
                });
            });

    // TODO in real practice, this route should be removed!!
    // this is just for test of dummy 3rd party app
    // if there is no error, this 3rd party app server should exchange token using received code
    // otherwise, 3rd party app server should handle error along to error type
    // (we just print received code here)
    router.get('/oauth2/authorize/callback', function (req, res) {
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

module.exports.initialize = initialize;
