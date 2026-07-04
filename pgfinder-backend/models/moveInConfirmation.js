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
    ownerConfirmed:{
        type:Boolean,
        default:false,
        index:true
    },
    ownerConfirmedOn:{
        type:Date
    },
    ownerConfirmationNote:{
        type:String
    },
    rewardCoins:{
        type:Number,
        default:0
    },
    redemptionHistory:{
        type:[{
            coins:Number,
            status:{ type:String, default:"pending" },
            note:String,
            addedOn:{ type:Date, default:Date.now }
        }],
        default:[]
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
    isDummy:{
        type:Boolean,
        default:false,
        index:true
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    recordStatus:{
        type:String,
        enum:["active","archived","demo","suspended"],
        default:"active"
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
moveInConfirmationSchema.index({ vendorId: 1, isActive: 1 });
moveInConfirmationSchema.index({ propertyId: 1, isActive: 1 });
moveInConfirmationSchema.index({ status: 1, isActive: 1 });
moveInConfirmationSchema.index({ isDummy: 1 });

module.exports = mongoose.model('moveInConfirmation', moveInConfirmationSchema);
