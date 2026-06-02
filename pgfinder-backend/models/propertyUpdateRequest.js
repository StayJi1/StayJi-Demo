var mongoose = require('mongoose');

propertyUpdateRequestSchema = mongoose.Schema({
    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster',
        required:true,
        index:true
    },
    ownerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster',
        required:true,
        index:true
    },
    requestedChanges:{
        type:Object,
        default:{}
    },
    previousValue:{
        type:Object,
        default:{}
    },
    status:{
        type:String,
        enum:["Pending","Approved","Rejected"],
        default:"Pending",
        index:true
    },
    adminId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    adminNote:{
        type:String
    },
    reviewedOn:{
        type:Date
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

module.exports = mongoose.model('propertyUpdateRequest', propertyUpdateRequestSchema);
