
var mongoose = require('mongoose');
inquirySchema = mongoose.Schema({
    propertyIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    vendorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    subject:{
        type:String
    },
    description:{
        type:String
    },
    preferredVisitTime:{
        type:String
    },
    moveInPreference:{
        type:String
    },
    leadStage:{
        type:String,
        default:"qualified"
    },
    isConverted:{
        type:Boolean,
        default:false
    },
    userIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    reply:{
        type:String
    },
    status:{
        type:mongoose.Schema.Types.Mixed,
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
inquirySchema.pre('save', function(next) {
    if (!this.propertyId && this.propertyIDFK) this.propertyId = this.propertyIDFK;
    if (!this.propertyIDFK && this.propertyId) this.propertyIDFK = this.propertyId;
    next();
});
inquirySchema.index({ propertyIDFK: 1, isActive: 1 });
inquirySchema.index({ propertyId: 1, isActive: 1 });
inquirySchema.index({ vendorId: 1, isActive: 1 });
inquirySchema.index({ userIDFK: 1, isActive: 1 });
inquirySchema.index({ isDummy: 1 });
module.exports = mongoose.model('inquiryMaster',inquirySchema);
