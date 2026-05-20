var mongoose = require('mongoose');
var express = require('express');
var mgClient = require('./connection/dbconnect');

var app = express();

var bodyParser = require("body-parser");

const path = require('path');

const PORT = process.env.PORT || 3000;

const session = require('express-session');

var cors = require("cors");

app.disable('x-powered-by');

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
*/

const corsOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://pg-finder-alpha.vercel.app",
    "https://stayji-stayji.vercel.app",
    "https://stayji.com",
    "https://www.stayji.com"
];

app.use(cors({
    origin: function(origin, callback) {

        if (!origin) {
            return callback(null, true);
        }

        if (corsOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("CORS Not Allowed"));
        }
    },
    credentials: true
}));
/*
|--------------------------------------------------------------------------
| Security Headers
|--------------------------------------------------------------------------
*/

app.use(function(req, res, next) {

    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
});

/*
|--------------------------------------------------------------------------
| Body Parser
|--------------------------------------------------------------------------
*/

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: false
}));

/*
|--------------------------------------------------------------------------
| Static Files
|--------------------------------------------------------------------------
*/

app.use('/upload', express.static(path.join(__dirname, 'upload')));

app.use('/public', express.static(path.join(__dirname, 'public')));

/*
|--------------------------------------------------------------------------
| Session Configuration
|--------------------------------------------------------------------------
*/

app.use(session({
    secret: process.env.SESSION_SECRET || 'stayji_secret_key',

    saveUninitialized: false,

    resave: false,

    rolling: true,

    cookie: {
        maxAge: 30 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}));

/*
|--------------------------------------------------------------------------
| View Engine
|--------------------------------------------------------------------------
*/

app.engine('html', require('ejs').renderFile);

app.set("view engine", "html");

app.set("views", "views");

/*
|--------------------------------------------------------------------------
| Root Route
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {

    res.send('StayJi Backend Running Successfully 🚀');
});

/*
|--------------------------------------------------------------------------
| Controllers
|--------------------------------------------------------------------------
*/

const adminController = require('./controllers/adminController');

const clientController = require('./controllers/clientController');

app.use('/admin', adminController);

app.use('/client', clientController);

/*
|--------------------------------------------------------------------------
| Modern REST API Aliases
|--------------------------------------------------------------------------
*/

// AUTH APIs

app.post('/api/auth/login', (req, res, next) => {

    req.url = '/loginByUser';

    clientController(req, res, next);
});

app.post('/api/auth/signup', (req, res, next) => {

    req.url = '/addUser';

    clientController(req, res, next);
});

// PROPERTY APIs

app.get('/api/properties', (req, res, next) => {

    req.url = '/getPropertyList';

    clientController(req, res, next);
});

app.post('/api/properties', (req, res, next) => {

    req.url = '/addProperty';

    clientController(req, res, next);
});

// ADMIN APIs

app.get('/api/admin/stats', (req, res, next) => {

    req.url = '/getAdminStats';

    clientController(req, res, next);
});

/*
|--------------------------------------------------------------------------
| API Route Groups
|--------------------------------------------------------------------------
*/

app.use('/api/auth', clientController);

app.use('/api/properties', clientController);

app.use('/api/vendors', clientController);

app.use('/api/admin', clientController);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const server = app.listen(PORT, () => {

    console.log("Connected to Port " + PORT);
});

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

server.on('error', (error) => {

    if (error.code === 'EADDRINUSE') {

        console.error(`Port ${PORT} is already in use.`);

        return;
    }

    if (error.code === 'EPERM') {

        console.error(`Permission denied while opening port ${PORT}.`);

        return;
    }

    throw error;
});