var oauth2orize = require('oauth2orize');
var utils = require('./utils/utils');
var tokenizer = require('./utils/tokenizer');
var predefine = require('./predefine');

// requires databases
var AuthorizeCode = require(__appbase_dirname + '/models/model-authorizecode');
var Token = require(__appbase_dirname + '/models/model-token');
var OauthClient = require(__appbase_dirname + '/models/model-oauthclient');
var User = require(__appbase_dirname + '/models/model-user');

var server = null;
var initialize = function() {
    // create a server for oauth2 provider 
    if (server) {
        console.log('oauth2 server was already initialized!');
        return;
    }
    server = oauth2orize.createServer();

    // serialization & deserialization 
    server.serializeClient(function(client, done) {
        return done(null, client.clientId);
    });
    server.deserializeClient(function(id, done) {
        OauthClient.findOne({
            'clientId': id
        }, function (err, client) {
            if (err) {
                return done(err);
            }
            return done(null, client);
        });
    });

    setGrant(server);
    setExchangeToken(server);
}

var setGrant = function(server) {
    if (!server) {
        throw Error();
    }

    // register grant for 'code' and 'token' (only two types are supported to user authorization endpoint)
    // The other grant types are directly requested to authroization server from client
    server.grant(oauth2orize.grant.code(function (client, redirectURI, user, ares, done) {
        AuthorizeCode.findOne({
            'clientId': client.clientId,
            'userId': user.id,
            'redirectURI': redirectURI
        }, function (err, authCode) {
            console.log('enter authorization_code type for grant'); 
            if (err) {
                return done(new oauth2orize.AuthorizationError(
                        'Error occurs during finding code',
                        'server_error'
                ));
            }
            if (authCode === null) {
                // TODO how to generate 'authorize code'
                var code = utils.uid(16);
                var authCode = new AuthorizeCode();
                
                // save new authorize code into db
                authCode.code = code;
                authCode.clientId = client.clientId;
                authCode.redirectURI = redirectURI;
                authCode.userId = user.id; // this id is identifier of User, not email
                authCode.save(function (err) {
                    if (err) {
                        return done(new oauth2orize.AuthorizationError(
                                'Error occurs during saving code',
                                'server_error'
                        ));
                    }
                    console.log(authCode);
                    return done(null, code);
                });
            } else {
                return done(null, authCode.code);
            }
        });
    }));

    // this grant type is used for mobile app or browser based web app
    // client id and redirect uri are needed for get access token
    // in case of mobile native app, redirect uri would have custom scheme
    //  e.g) fb00000000://authorize (this server will redirect it like the following)
    //        --> fb00000000://authroize#access_token=2YotnFZFEjr1zCsicMWpA&expires_in=3600
    // in case of mobile web app, redirect uri would be like the following
    //  e.g) http://example.com/cb
    //      --> http://example.com/cb#access_token=2YotnFZFEjr1zCsicMWpA&expires_in=3600
    server.grant(oauth2orize.grant.token(function (client, user, ares, done) {
        console.log('clientId: ' + client.clientId);
        console.log('userId: ' + user.id);
        Token.findOne({
            'clientId': client.clientId,
            'userId': user.id
        }, function (err, token) {
            console.log('enter implicit grant'); 
            if (err) {
                return done(new oauth2orize.TokenError(
                        'Error occurs during finding token',
                        'server_error'
                ));
            }
            if (token === null) {
                tokenizer.create(client.clientId, user.id,
                    predefine.oauth2.type.implicit, function (err, newToken) {
                        if (err) {
                            return done(new oauth2orize.TokenError(
                                    'Error occurs during creating token',
                                    'server_error'
                            ));
                        }
                        console.log('token for implicit type created!: ' + newToken);
                        return done(null,
                            newToken.accessToken,
                            { expires_in: newToken.expiredIn }
                        );
                });
            } else {
                console.log('token for implicit type exists!: ' + token);
                // check access token expiration
                return done(null,
                    token.accessToken,
                    { expires_in: token.expiredIn }
                );
            }
        });
    }));
};

var setExchangeToken = function(server) {
    if (!server) {
        throw Error();
    }

    // register exchange to get access token from authorization server
    // 1. grant_type = authorization_code 
    server.exchange(oauth2orize.exchange.code(function (client, code, redirectURI, done) {
        AuthorizeCode.findOne({
            'code': code,
            'clientId': client.clientId,
            'redirectURI': redirectURI
        }, function (err, authCode) {
            if (err) {
                return done(new oauth2orize.TokenError(
                        'Error occurs during finding given code',
                        'server_error'
                ));
            }
            if (authCode === null) {
                return done(new oauth2orize.TokenError(
                        'The provided authorization grant is not valid',
                        'invalid_grant'
                ));
            }

            // we need to check if access token for this user exists 
            Token.findOne({
                'clientId': authCode.clientId,
                'userId': authCode.userId
            }, function (err, token) {
                if (err) {
                    return done(new oauth2orize.TokenError(
                            'Error occurs during finding token',
                            'server_error'
                    ));
                }
                if (token === null) {
                    tokenizer.create(authCode.clientId, authCode.userId,
                        predefine.oauth2.type.authorizationCode,
                        function (err, newToken) {
                            if (err) {
                                return done(new oauth2orize.TokenError(
                                        'Error occurs during creating token',
                                        'server_error'
                                ));
                            }
                            return done(null,
                                newToken.accessToken,
                                newToken.refreshToken,
                                { expires_in: newToken.expiredIn }
                            );
                    });
                } else {
                    // check access token expiration
                    return done(null,
                        token.accessToken,
                        token.refreshToken,
                        { expires_in: token.expiredIn }
                    );
                }
            });
        });
    }));

    // 2. grant_type = password
    server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
        console.log('enter exchange function \'password\' grant type');
        // client is already verified using middleware(basic), but not user
        // check username type 
        var query;
        var isLocalAccount = false;
        switch(username) {
            case 'twitter':
                query = { 'twitter.token': password };
                break;
            case 'facebook':
                query = { 'facebook.token': password };
                break;
            case 'google':
                query = { 'google.token': password };
                break;
            case 'yahoo':
                query = { 'yahoo.token': password };
                break;
            case 'linkedin':
                query = { 'linkedin.token': password };
                break;
            case 'github':
                query = { 'github.token': password };
                break;
            default:
                isLocalAccount = true;
                query = { 'local.email': username };
                break;
        }

        User.findOne(query, function (err, user) {
            if (err) {
                return done(new oauth2orize.TokenError(
                        'Error occurs during finding token',
                        'server_error'
                ));
            }
            if (user === null) {
                return done(new oauth2orize.TokenError(
                        'resource owner credential is not correct',
                        'invalid_grant'
                ));
            }
            if (isLocalAccount) {
                if (!user.validPassword(password)) {
                    return done(new oauth2orize.TokenError(
                            'resource owner credential is not correct',
                            'invalid_grant'
                    ));
                }
            }

            // we need to check if access token for this user exists 
            Token.findOne({
                'clientId': client.clientId,
                'userId': user.id
            }, function (err, token) {
                if (err) {
                    return done(new oauth2orize.TokenError(
                            'Error occurs during finding token',
                            'server_error'
                    ));
                }
                if (token === null) {
                    tokenizer.create(client.clientId, user.id,
                        predefine.oauth2.type.password,
                        function (err, newToken) {
                            if (err) {
                                return done(new oauth2orize.TokenError(
                                        'Error occurs during creating token',
                                        'server_error'
                                ));
                            }
                            return done(null,
                                newToken.accessToken,
                                newToken.refreshToken,
                                { expires_in: newToken.expiredIn }
                            );
                    });
                } else {
                    // check access token expiration
                    return done(null,
                        token.accessToken,
                        token.refreshToken,
                        { expires_in: token.expiredIn }
                    );
                }
            });
        });
    }));

    // 3. grant_type = client_credentials
    server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, done) {
        Token.findOne({
            'clientId': client.clientId
        }, function (err, token) {
            if (err) {
                return done(new oauth2orize.TokenError(
                        'Error occurs during finding token',
                        'server_error'
                ));
            }
            if (token === null) {
                tokenizer.create(client.clientId, null,
                    predefine.oauth2.type.clientCredentials,
                    function (err, newToken) {
                        if (err) {
                            return done(new oauth2orize.TokenError(
                                    'Error occurs during creating token',
                                    'server_error'
                            ));
                        }
                        return done(null,
                            newToken.accessToken,
                            newToken.refreshToken,
                            { expires_in: newToken.expiredIn }
                        );
                });
            } else {
                // check access token expiration
                return done(null,
                    token.accessToken,
                    token.refreshToken,
                    { expires_in: token.expiredIn }
                );
            }
        });
    }));

    // this exchange is for refreshing access token
    server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
        Token.findOne({
            clientId: client.clientId,
            refreshToken: refreshToken
        }, function (err, token) {
            if (err) {
                return done(new oauth2orize.TokenError(
                        'Error occurs during finding token',
                        'server_error'
                ));
            }
            if (!token) {
                return done(new oauth2orize.TokenError(
                        'This refresh token doesn\'t exist',
                        'invalid_grant'
                ));
            }

            tokenizer.refresh(token, function (err, updatedToken) {
                if (err) {
                    return done(new oauth2orize.TokenError(
                            'Error occurs during refreshing token',
                            'server_error'
                    ));
                }
                return done(null,
                    updatedToken.accessToken,
                    updatedToken.refreshToken,
                    { expires_in: updatedToken.expiredIn }
                );
            });
        });
    }));
};

// user authorization endpoint
var authorize = function () {
    return [
        error(),
        server.authorization(function (clientId, redirectURI, done) {
           OauthClient.findOne({
               'clientId': clientId,
               'redirectURI': redirectURI
           }, function (err, oauthClient) {
               console.log('clientId: ' + clientId);
               console.log('redirectURI: ' + redirectURI);
               if (err) {
                    return done(new oauth2orize.AuthorizationError(
                            'Error occurs during finding OAuth client',
                            'server_error'
                    ));
               }
               if (oauthClient === null) {
                    return done(new oauth2orize.AuthorizationError(
                            'There is not matched client',
                            'unauthorized_client'
                    ));
               }
               return done(null, oauthClient, redirectURI);
           });
        }),
        function (req, res) {
            res.render('local_account_oauth', { 
                transactionID: req.oauth2.transactionID,
                user: req.user,
                client: req.oauth2.client
            });
        }
    ];
};

var decision = function () {
    return server.decision();
};

var token = function () {
    return [error(), server.token(), server.errorHandler()];
};

var error = function() {
    return function (err, req, res, next) {
        if (err) {
            server.errorHandler()(err, req, res);
        }
    };
};
    

exports.initialize = initialize;
exports.authorize = authorize;
exports.decision = decision;
exports.token = token;
exports.error = error;
