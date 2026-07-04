
var mongoose = require('mongoose');
visitSchema = mongoose.Schema({
    visitDate:{
        type:String
    },
    visitTime:{
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
    userIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    status:{
        type:String
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
visitSchema.pre('save', function(next) {
    if (!this.propertyId && this.propertyIDFK) this.propertyId = this.propertyIDFK;
    if (!this.propertyIDFK && this.propertyId) this.propertyIDFK = this.propertyId;
    if (!this.userId && this.userIDFK) this.userId = this.userIDFK;
    if (!this.userIDFK && this.userId) this.userIDFK = this.userId;
    next();
});
visitSchema.index({ propertyIDFK: 1, isActive: 1 });
visitSchema.index({ propertyId: 1, isActive: 1 });
visitSchema.index({ vendorId: 1, isActive: 1 });
visitSchema.index({ userIDFK: 1, isActive: 1 });
visitSchema.index({ isDummy: 1 });
module.exports = mongoose.model('visitDetails',visitSchema);
