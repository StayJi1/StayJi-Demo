var mongoose = require('mongoose');
var express = require('express');
var mgClient = require('./connection/dbconnect')
var app = express();
var bodyParser =  require("body-parser");
var expressValidator = require("express-validator");
const path  = require('path');
const PORT = process.env.PORT || 3000;
// var urlEncodedParser = bodyParser.urlencoded({extended:false});

const session = require('express-session');
var cors = require("cors");
app.use(cors());
app.use(bodyParser.json());
// app.use(expressValidator());
app.use(bodyParser.urlencoded({extended:false}));
// app.use(express.static('upload/studentImage'));
// app.use(express.static('upload/noticeImage'));
// app.use(express.static('upload/principalImage'));
// app.use(express.static('upload/teacherImage'));
app.use(express.static(path.join(__dirname,'upload')));
app.use(express.static(path.join(__dirname,'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'ssshhhhh',
    saveUninitialized: false,
    resave: false,
    rolling: true,
    cookie: { maxAge: 30 * 60 * 1000 }
}));

app.engine('html',require('ejs').renderFile);
app.set("view engine","html");
app.set("views","views");

const adminController = require('./controllers/adminController');

app.use('/admin',adminController);

const clientController = require('./controllers/clientController');

app.use('/client',clientController);

app.listen(PORT,()=>{
    console.log("Connected to Port "+PORT);
})
