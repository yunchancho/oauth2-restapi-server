var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/sociallogin';

var initialize = function () {
    mongoose.connect(dbUrl);
};

module.exports.initialize = initialize;
