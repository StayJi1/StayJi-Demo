
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
    verificationStatus:{
        type:String,
        enum:["Pending","Verified","Rejected"],
        default:"Pending"
    },
    resetOtp:{
        type:String
    },
    resetOtpExpiresAt:{
        type:Date
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

userSchema.set('toJSON', {
    transform: function (doc, ret) {
        delete ret.userPassword;
        return ret;
    }
});

userSchema.set('toObject', {
    transform: function (doc, ret) {
        delete ret.userPassword;
        return ret;
    }
});

module.exports = mongoose.model('userMaster',userSchema);
