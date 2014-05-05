var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var utils = require(__appbase_dirname + '/routes/auth/utils/utils');

var schema = mongoose.Schema({
    name: String,
    clientId: String,
    clientSecret: String,
    redirectURI: String,
    // grant_type is 4
    // 'authorization_code', ('implicit',) 'password', 'client_credentials'
    // first item : grant_type string
    // second item : is it possible to refresh token
    grantType: [String, Boolean]
});

schema.pre('save', function (next) {
    if (!this.isNew) {
        return next();
    }
    this.clientId = utils.uid(16);
    this.clientSecret = utils.uid(32);
    next();
});

module.exports = mongoose.model('OauthClient', schema);
