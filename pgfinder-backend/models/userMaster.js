
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
    bio:{
        type:String
    },
    city:{
        type:String
    },
    socialLinks:{
        type:[String],
        default:[]
    },
    emailVerified:{
        type:Boolean,
        default:false
    },
    phoneVerified:{
        type:Boolean,
        default:false
    },
    accountStatus:{
        type:String,
        enum:["active","suspended","blocked","pending_verification"],
        default:"active"
    },
    termsAcceptedAt:{
        type:Date
    },
    privacyAcceptedAt:{
        type:Date
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
