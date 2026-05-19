var mongoose = require('mongoose');

adminMessageSchema = mongoose.Schema({
    vendorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    adminId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    senderRole:{
        type:String,
        enum:["admin","vendor"],
        default:"admin"
    },
    message:{
        type:String
    },
    deletedForAdmin:{
        type:Boolean,
        default:false
    },
    deletedForVendor:{
        type:Boolean,
        default:false
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

module.exports = mongoose.model('adminMessage',adminMessageSchema);
