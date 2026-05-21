
var mongoose = require('mongoose');
var Mixed = mongoose.Schema.Types.Mixed;
chatSchema = mongoose.Schema({
    text:{
        type:String
    },
    fromUserIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    toUserIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    conversationType:{
        type:String,
        default:"user_vendor"
    },
    metadata:{
        type:Mixed,
        default:{}
    },
    addedOn:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    }
});
module.exports = mongoose.model('chatMaster',chatSchema);
