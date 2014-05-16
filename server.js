var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

// for authentication and authorization
var passport = require('passport');
var connectFlash = require('connect-flash');

// set global objects
global.__appbase_dirname = __dirname;

// load local modules
var apiRouter = require('./api_server/router');
var oauth2Router = require('./oauth2_server/router');
var database = require('./models/database');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// declaration of local middlewares
// TODO this should be changed to more generic implementation
// internal middleware for redirect to http with TLS (https)
var redirectHttps = function () {
    return function (req, res, next) {
        if (!req.secure) {
            console.log('redirect secure http server');
            return res.redirect('https://' + req.host + ':3443' + req.url);
        }
        next();
    };
};

// initialize database model handler and path route handler
// register middlewares
app.use(logger('dev'));
app.all('*', redirectHttps());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat', key: 'sid'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(connectFlash());

// add middleware for authentication
database.initialize();
apiRouter.initialize(app);
oauth2Router.initialize(app);

// start backend with functionalities of both of API server and OAuth2 Server)
var https = require('https');
var fs = require('fs');
var debug = require('debug')('backend');

// This is just selfsigned certificate. 
// for product, you can replace this to own certificates  
var privateKey = './ssl/key.pem';
var publicCert = './ssl/public.cert';
var publicCertPassword = '12345';
var httpsConfig = {
    key: fs.readFileSync(privateKey),
    cert: fs.readFileSync(publicCert),
    passphrase: publicCertPassword
};

// http protocol 
var server = app.listen(3000, function() {
    debug('Express server listening on port ' + server.address().port);
});

// https protocol
var sslServer = https.createServer(httpsConfig, app);
sslServer.listen(3443, function() {
    debug('Express SSL server listening on port ' + sslServer.address().port);
});
