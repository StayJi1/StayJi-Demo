
var mongoose = require('mongoose');
shortlistSchema = mongoose.Schema({
    propertyIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    userIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    userId:{
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
shortlistSchema.pre('save', function(next) {
    if (!this.propertyId && this.propertyIDFK) this.propertyId = this.propertyIDFK;
    if (!this.propertyIDFK && this.propertyId) this.propertyIDFK = this.propertyId;
    if (!this.userId && this.userIDFK) this.userId = this.userIDFK;
    if (!this.userIDFK && this.userId) this.userIDFK = this.userId;
    next();
});
module.exports = mongoose.model('shortlistMaster',shortlistSchema);
