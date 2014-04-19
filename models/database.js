var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/social-logins';

var initialize = function () {
    mongoose.connect(dbUrl);
};

module.exports.initialize = initialize;
