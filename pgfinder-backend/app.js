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

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
*/

const corsOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://final-pg-finder-alpha.vercel.app"
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
        maxAge: 30 * 60 * 1000
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

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
    console.log("Connected to Port " + PORT);
});