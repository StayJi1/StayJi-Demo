var mongoose = require('mongoose');

auditLogSchema = mongoose.Schema({
    performerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    performerRole:{
        type:String
    },
    action:{
        type:String,
        required:true,
        index:true
    },
    entityType:{
        type:String,
        index:true
    },
    entityId:{
        type:mongoose.Schema.Types.ObjectId
    },
    city:{
        type:String
    },
    state:{
        type:String
    },
    previousValue:{
        type:Object,
        default:{}
    },
    updatedValue:{
        type:Object,
        default:{}
    },
    metadata:{
        type:Object,
        default:{}
    },
    addedOn:{
        type:Date,
        default:Date.now,
        index:true
    },
    isActive:{
        type:Boolean,
        default:true
    }
});

module.exports = mongoose.model('auditLog', auditLogSchema);
