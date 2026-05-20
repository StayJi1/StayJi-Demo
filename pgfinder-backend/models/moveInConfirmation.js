var mongoose = require('mongoose');

moveInConfirmationSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    vendorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    leadEventId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'leadEvent'
    },
    ownerName:{
        type:String
    },
    joiningDate:{
        type:String
    },
    paymentScreenshot:{
        type:String
    },
    roomImage:{
        type:String
    },
    userNote:{
        type:String
    },
    adminNote:{
        type:String
    },
    status:{
        type:String,
        enum:["Pending","Verified","Rejected","Suspicious"],
        default:"Pending"
    },
    commissionAmount:{
        type:Number,
        default:2000
    },
    cashbackAmount:{
        type:Number,
        default:250
    },
    duplicateRisk:{
        type:Boolean,
        default:false
    },
    addedOn:{
        type:Date,
        default:Date.now
    },
    verifiedOn:{
        type:Date
    },
    isActive:{
        type:Boolean,
        default:true
    }
});

moveInConfirmationSchema.index({ userId: 1, propertyId: 1, isActive: 1 });

module.exports = mongoose.model('moveInConfirmation', moveInConfirmationSchema);
