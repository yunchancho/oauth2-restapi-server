var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/new_social_app';

var initialize = function () {
    mongoose.connect(dbUrl);
};

module.exports.initialize = initialize;
