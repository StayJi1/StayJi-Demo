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
    addedOn:{
        type:Date,
        default:Date.now
    },
    isActive:{
        type:Boolean,
        default:true
    }
});

module.exports = mongoose.model('leadEvent', leadEventSchema);
