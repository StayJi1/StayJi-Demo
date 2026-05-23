
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
    status:{
        type:String,
        enum:["active","archived","demo","suspended"],
        default:"active"
    },
    isDummy:{
        type:Boolean,
        default:false,
        index:true
    },
    isVerified:{
        type:Boolean,
        default:false
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
shortlistSchema.index({ propertyIDFK: 1, isActive: 1 });
shortlistSchema.index({ propertyId: 1, isActive: 1 });
shortlistSchema.index({ userIDFK: 1, isActive: 1 });
shortlistSchema.index({ isDummy: 1 });
module.exports = mongoose.model('shortlistMaster',shortlistSchema);
