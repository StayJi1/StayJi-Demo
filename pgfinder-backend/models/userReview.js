
var mongoose = require('mongoose');
var Mixed = mongoose.Schema.Types.Mixed;
userReviewSchema = mongoose.Schema({
    details:{
        type:String
    },
    rating:{
        type:String
    },
    tags:{
        type:[String],
        default:[]
    },
    sentiment:{
        type:String
    },
    ownerReply:{
        type:String
    },
    ownerReplyOn:{
        type:Date
    },
    moderatedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    moderatedOn:{
        type:Date
    },
    reviewContext:{
        type:Mixed,
        default:{}
    },
    userIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    propertyIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    status:{
        type:String,
        enum:["active","archived","demo","suspended","flagged"],
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
userReviewSchema.pre('save', function(next) {
    if (!this.propertyId && this.propertyIDFK) this.propertyId = this.propertyIDFK;
    if (!this.propertyIDFK && this.propertyId) this.propertyIDFK = this.propertyId;
    if (!this.userId && this.userIDFK) this.userId = this.userIDFK;
    if (!this.userIDFK && this.userId) this.userIDFK = this.userId;
    next();
});
userReviewSchema.index({ propertyIDFK: 1, isActive: 1 });
userReviewSchema.index({ propertyId: 1, isActive: 1 });
userReviewSchema.index({ userIDFK: 1, isActive: 1 });
userReviewSchema.index({ isDummy: 1 });
module.exports = mongoose.model('userReview',userReviewSchema);
