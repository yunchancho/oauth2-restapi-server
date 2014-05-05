var mongoose = require('mongoose');

var schema = mongoose.Schema({
    accessToken: String,
    refreshToken: String,
    expiredIn: Number,
    clientId: String,
    userId: String,
    createdTime: Number
});

schema.pre('save', function (next) {
    if (!this.isNew) {
        return next();
    }
    this.createdTime = Date.now();
    next();
});


// create the model for users and expose it to our app
module.exports = mongoose.model('AccessToken', schema);
