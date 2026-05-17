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

app.use(cors({
    origin: corsOrigins,
    credentials: true
}));

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