var mongoose = require('mongoose');

leadEventSchema = mongoose.Schema({
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
    sourceType:{
        type:String,
        enum:["interest","inquiry","callback","visit","contact_reveal","chat_detection","vendor_acceptance","move_in"],
        default:"interest"
    },
    status:{
        type:String,
        enum:["Interested","Inquiry Started","Callback Requested","Visit Requested","Visit Confirmed","Contact Shared","Moved In","Converted","Cancelled"],
        default:"Interested"
    },
    note:{
        type:String
    },
    metadata:{
        type:Object,
        default:{}
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
    isActive:{
        type:Boolean,
        default:true
    }
});

leadEventSchema.index({ propertyId: 1, isActive: 1 });
leadEventSchema.index({ vendorId: 1, isActive: 1 });
leadEventSchema.index({ userId: 1, isActive: 1 });
leadEventSchema.index({ isDummy: 1 });
leadEventSchema.index({ status: 1 });

module.exports = mongoose.model('leadEvent', leadEventSchema);
