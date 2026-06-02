var mongoose = require('mongoose');
var Mixed = mongoose.Schema.Types.Mixed;

messageSchema = mongoose.Schema({
    conversationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'conversation',
        required:true
    },
    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    fromUserIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster',
        required:true
    },
    toUserIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster',
        required:true
    },
    senderRole:{
        type:String,
        enum:["user","owner"],
        required:true
    },
    text:{
        type:String,
        required:true
    },
    metadata:{
        type:Mixed,
        default:{}
    },
    readAt:{
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

messageSchema.index({ conversationId: 1, addedOn: 1 });
messageSchema.index({ fromUserIDFK: 1, isActive: 1 });
messageSchema.index({ toUserIDFK: 1, isActive: 1, readAt: 1 });
messageSchema.index({ propertyId: 1, isActive: 1 });

module.exports = mongoose.model('message', messageSchema);
