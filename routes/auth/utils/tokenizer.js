var oauth2orize = require('oauth2orize');
var Token = require(__appbase_dirname + '/models/model-token');
var utils = require('./utils');

var createToken = function (clientId, userId, grantType, cb) {
    var token = new Token();
    token.accessToken = utils.uid(256);
    if (grantType.token_refreshable) {
        token.refreshToken = utils.uid(256);
    }
    token.expiredIn = grantType.token_duration;
    token.clientId = clientId;
    token.userId = userId;
    // TODO add scope
    token.save(function (err) {
        if (err) {
            return cb(err);
        }
        return cb(err, token);
    });
};

var refreshToken = function (token, cb) {
    if (!token) {
        return cb(new Error());
    }

    // recreate access token
    token.accessToken = utils.uid(256);
    token.createdTime = Date.now();
    // TODO update scope
    Token.update({
        clientId: token.clientId,
        userId: token.userId,
        refreshToken: token.refreshToken
    }, {
        accessToken: token.accessToken,
        createdTime: token.createdTime
    }, function (err, result) {
        if (err) {
            return cb(new Error());
        }
        return cb(err, token);
    });
};

var validateToken = function (accessToken, userId, cb) {
    if (!accessToken) {
        return cb(new oauth2orize.TokenError(
                'access token is not given',
                'invalid_request'));
    }

    Token.findOne({
        accessToken: accessToken,
        userId: userId
    }, function (err, token) {
        if (err) {
            return cb(err);
        }

        if (token === null) {
            return cb(new oauth2orize.TokenError(
                    'There is not matched access token',
                    'invalid_grant'));
        }

        if ((Date.now() - token.createdTime) > (token.expiredIn * 1000)) {
            console.log('token is expired!!');
            return cb(new oauth2orize.TokenError(
                    'given access token was expired',
                    'invalid_grant'));
        }
        return cb();
    });
};

module.exports.create = createToken;
module.exports.refresh = refreshToken;
module.exports.validate = validateToken;
