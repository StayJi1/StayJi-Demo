
var mongoose = require('mongoose');
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
    addedOn:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    }
});
module.exports = mongoose.model('chatMaster',chatSchema);