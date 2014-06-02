var mongoose = require('mongoose');

var schema = mongoose.Schema({
    userId: String,
    content: String,
    modifiedTime: Number,
    createdTime: Number
});

schema.pre('save', function (next) {
    if (!this.isNew) {
        this.modifiedTime = Date.now();
        return next();
    }
    this.createdTime = Date.now();
    this.modifiedTime = this.createdTime;
    next();
});

// create the model and expose it to our app
module.exports = mongoose.model('Wish', schema);
