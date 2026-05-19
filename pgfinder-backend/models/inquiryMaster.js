
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
    preferredVisitTime:{
        type:String
    },
    moveInPreference:{
        type:String
    },
    leadStage:{
        type:String,
        default:"qualified"
    },
    isConverted:{
        type:Boolean,
        default:false
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
