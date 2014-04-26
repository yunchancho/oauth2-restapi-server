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
var router = require('./routes/router');
var database = require('./models/database');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// initialize database model handler and path route handler
// setting middleware 
app.use(logger('dev'));
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
router.initialize(app);

module.exports = app;
