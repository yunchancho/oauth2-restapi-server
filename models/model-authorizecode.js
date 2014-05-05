var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var schema = mongoose.Schema({
    code: String,
    redirectURI: String,
    clientId: String,
    userId: String
});

module.exports = mongoose.model('AuthorizeCode', schema);
