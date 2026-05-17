
var mongoose = require('mongoose');
userSchema = mongoose.Schema({
    userName:{
        type:String
    },
    userFname:{
        type:String
    },
    userLname:{
        type:String
    },
    userEmail:{
        type:String
    },
    userPassword:{
        type:String
    },
    dob:{
        type:String
    },
    gender:{
        type:String
    },
    contact:{
        type:String
    },
    occupation:{
        type:String
    },
    userType:{
        type:String
    },
    profile:{
        type:String
    },
    addedOn:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    }
});
module.exports = mongoose.model('userMaster',userSchema);