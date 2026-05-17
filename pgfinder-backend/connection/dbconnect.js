var mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();
module.exports = mongoose.connect(process.env.DATABASE,
{useNewUrlParser:true, useUnifiedTopology: true}).then(()=>{
    console.log("connected");
});