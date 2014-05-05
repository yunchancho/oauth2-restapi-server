var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var schema = mongoose.Schema({
    local : {
        email : String,
        password : String
    },
    twitter : {
        id : String,
        token : String,
        tokenSecret : String,
        displayName  : String,
        photo : String
    },
    facebook : {
        id : String,
        token : String,
        refreshToken : String,
        displayName : String,
        email : String
    },
    google : {
        id : String,
        token : String,
        refreshToken : String,
        displayName : String,
        email : String,
        photo : String
    },
    yahoo : {
        id : String,
        token : String,
        tokenSecret : String,
        displayName : String
    },
    linkedin : {
        id : String,
        token : String,
        tokenSecret : String,
        displayName : String,
        email : String,
        industry : String,
        headline : String,
        photo : String
    },
    github : {
        id : String,
        token : String,
        refreshToken : String,
        displayName : String,
        email : String,
        photo : String
    }
});

// generating a hash
schema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
schema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', schema);
