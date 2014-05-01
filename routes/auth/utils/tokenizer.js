var jwt = require('jwt-simple');
var moment = require('moment');   

var tokenSecret = 'abc12345';
var expire = moment().add('days', 7).valueOf();

var createToken = function (userId) {
    if (!userId) {
        // TODO throw error more properly
        throw Error();
    }
    return jwt.encode({
        iss: userId,
        exp: expire,
    }, tokenSecret);
};

var resolveToken = function (token) {
    if (!token) {
        throw Error();
    }
    var resolved = jwt.decode(token, tokenSecret);
    if (resolved.exp <= Date.now())  {
        // TODO should send request to frontend to be reauthenticated 
        // to get new access token
        throw Error();
    }
    return resolved;
};

module.exports.create = createToken;
module.exports.resolve = resolveToken;
