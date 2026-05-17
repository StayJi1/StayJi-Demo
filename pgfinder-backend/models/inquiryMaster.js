
var mongoose = require('mongoose');
inquirySchema = mongoose.Schema({
    propertyIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    subject:{
        type:String
    },
    description:{
        type:String
    },
    userIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    reply:{
        type:String
    },
    status:{
        type:Boolean
    },
    addedOn:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    }
});
module.exports = mongoose.model('inquiryMaster',inquirySchema);