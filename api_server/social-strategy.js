var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var GithubStrategy = require('passport-github').Strategy;
var LinkedinStrategy = require('passport-linkedin-oauth2').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var YahooStrategy = require('passport-yahoo-oauth').Strategy;
var oauthInfo = require('./oauth-info');
var User = require(__appbase_dirname + '/models/model-user');

module.exports.initialize = function () {

var registerSocialAccount = function (name, info, loginedUser, done) {
    //var search = {};
    var s = "{ \"" + name + ".id\": \"" + info.id + "\" }";
    var search = JSON.parse(s);
    User.findOne(search,
        function (err, user) {
            if (err) {
                console.error(err);
                return done(err);
            }

            // TODO in case of connect, how to handle this?
            if (user) {
                console.log(name + ' account already exists!');
                return done(null, user);
            } else {
                console.log('user not found');
            }

            var changedUser;
            if (loginedUser) {
                console.log(name + ' account is appended to logined user');
                changedUser = loginedUser;
            } else {
                console.log(name + ' account is not yet logined!');
                changedUser = new User();
            }

            switch (name) {
                case 'twitter':
                    changedUser.twitter = info;
                    break;
                case 'facebook':
                    changedUser.facebook = info;
                    break;
                case 'google':
                    changedUser.google = info;
                    break;
                case 'yahoo':
                    changedUser.yahoo = info;
                    break;
                case 'linkedin':
                    changedUser.linkedin = info;
                    break;
                case 'github':
                    changedUser.github = info;
                    break;
                default:
                    return done(null, false, { reason: 'unknown-social-app' });
            }
            changedUser.save(function (err) {
                if (err) {
                    console.error(err);
                    return done(err);
                }
                return done(null, changedUser);
            });
        }
    );
};

passport.use(new TwitterStrategy({
    consumerKey: oauthInfo.twitter.consumerKey,
    consumerSecret: oauthInfo.twitter.consumerSecret,
    callbackURL: oauthInfo.twitter.callbackURL,
    passReqToCallback: true
}, function (req, token, tokenSecret, profile, done) {
    console.log('twitter stragtegy');
    registerSocialAccount('twitter', {
        id: profile.id,
        token: token,
        tokenSecret: tokenSecret,
        displayName: profile.displayName,
        photo: profile.photos[0].value
    }, req.user, done);
}));

passport.use(new FacebookStrategy({
    clientID: oauthInfo.facebook.appId,
    clientSecret: oauthInfo.facebook.appSecret,
    callbackURL: oauthInfo.facebook.callbackURL,
    //profileFields: ['id', 'displayName', 'photos'],
    passReqToCallback: true
}, function (req, token, refreshToken, profile, done) {
    console.log('facebook stragtegy');
    registerSocialAccount('facebook', {
        id: profile.id,
        token: token,
        refreshToken: refreshToken,
        displayName: profile.name.familyName + ' ' + profile.name.givenName,
        email: (profile.emails[0].value || '').toLowerCase()
    }, req.user, done);
}));

passport.use(new GoogleStrategy({
    clientID: oauthInfo.google.clientId,
    clientSecret: oauthInfo.google.clientSecret,
    callbackURL: oauthInfo.google.callbackURL,
    passReqToCallback: true
}, function (req, token, refreshToken, profile, done) {
    console.log('google+ stragtegy');
    registerSocialAccount('google', {
        id: profile.id,
        token: token,
        refreshToken: refreshToken,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        photo: profile._json.picture
    }, req.user, done);
}));

passport.use(new YahooStrategy({
    consumerKey: oauthInfo.yahoo.consumerKey,
    consumerSecret: oauthInfo.yahoo.consumerSecret,
    callbackURL: oauthInfo.yahoo.callbackURL,
    passReqToCallback: true
}, function (req, token, refreshToken, profile, done) {
    console.log('yahoo stragtegy');
    registerSocialAccount('yahoo', {
        id: profile.id,
        token: token,
        refreshToken: refreshToken,
    }, req.user, done);
}));

passport.use(new LinkedinStrategy({
    clientID: oauthInfo.linkedin.apiKey,
    clientSecret: oauthInfo.linkedin.secretKey,
    callbackURL: oauthInfo.linkedin.callbackURL,
    passReqToCallback: true
}, function (req, token, refreshToken, profile, done) {
    console.log('linkedin stragtegy');
    registerSocialAccount('linkedin', {
        id: profile.id,
        token: token,
        refreshToken: refreshToken,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        industry: profile._json.industry,
        headline: profile._json.headline,
        photo: profile._json.pictureUrl
    }, req.user, done);
}));

passport.use(new GithubStrategy({
    clientID: oauthInfo.github.clientId,
    clientSecret: oauthInfo.github.clientSecret,
    callbackURL: oauthInfo.github.callbackURL,
    scope: [ 'user', 'repo', 'read:public_key' ],
    passReqToCallback: true
}, function (req, token, refreshToken, profile, done) {
    console.log('github stragtegy');
    registerSocialAccount('github', {
        id: profile.id,
        token: token,
        refreshToken: refreshToken,
        displayName: profile.username,
        email: profile.emails[0].value,
        photo: profile._json.avatar_url
    }, req.user, done);
}));

};
