var mongoose = require('mongoose');
var express = require('express');
var mgClient = require('./connection/dbconnect');

var app = express();

var bodyParser = require("body-parser");
var expressValidator = require("express-validator");

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
    "https://pg-finder-alpha.vercel.app/"
];

// Add environment variable CORS origins if provided
if (process.env.CORS_ORIGINS) {
    const envOrigins = process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
    corsOrigins.push(...envOrigins);
}

// Custom CORS handling: set explicit headers for allowed origins
app.use(function (req, res, next) {
    const origin = req.headers.origin;
    if (origin && corsOrigins.indexOf(origin) !== -1) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(function (req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-store');
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

app.use(express.static(path.join(__dirname, 'upload')));

app.use(express.static(path.join(__dirname, 'public')));

/*
|--------------------------------------------------------------------------
| Session Configuration
|--------------------------------------------------------------------------
*/

app.use(session({
    secret: process.env.SESSION_SECRET || 'ssshhhhh',
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

app.use('/admin', adminController);

const clientController = require('./controllers/clientController');

app.use('/client', clientController);
app.post('/api/auth/login', (req, res, next) => {
    req.url = '/loginByUser';
    clientController(req, res, next);
});
app.post('/api/auth/signup', (req, res, next) => {
    req.url = '/addUser';
    clientController(req, res, next);
});
app.get('/api/properties', (req, res, next) => {
    req.url = '/getPropertyList';
    clientController(req, res, next);
});
app.post('/api/properties', (req, res, next) => {
    req.url = '/addProperty';
    clientController(req, res, next);
});
app.get('/api/admin/stats', (req, res, next) => {
    req.url = '/getAdminStats';
    clientController(req, res, next);
});
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

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the other backend process or set PORT to another value.`);
        return;
    }
    if (error.code === 'EPERM') {
        console.error(`Permission denied while opening port ${PORT}. Start the backend with terminal permission or use another allowed port.`);
        return;
    }
    throw error;
});
