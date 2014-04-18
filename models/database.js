var mongoose = require('mongoose');
var dbUrl = 'mongodb://localhost/sociallogin';

module.exports = function () {
    mongoose.connect(dbUrl);
};
