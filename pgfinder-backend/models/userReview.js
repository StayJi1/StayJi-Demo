
var mongoose = require('mongoose');
userReviewSchema = mongoose.Schema({
    details:{
        type:String
    },
    rating:{
        type:String
    },
    userIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    propertyIDFK:{
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
module.exports = mongoose.model('userReview',userReviewSchema);