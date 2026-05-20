var mongoose = require('mongoose');

var notificationSchema = mongoose.Schema({
    recipientId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    recipientRole:{
        type:String,
        enum:["user","vendor","admin","all"],
        default:"user"
    },
    actorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    type:{
        type:String
    },
    title:{
        type:String
    },
    message:{
        type:String
    },
    link:{
        type:String
    },
    readAt:{
        type:Date
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

module.exports = mongoose.model('notification', notificationSchema);
