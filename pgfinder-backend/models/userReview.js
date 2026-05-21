
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
module.exports = mongoose.model('userReview',userReviewSchema);
