
var mongoose = require('mongoose');
paymentSchema = mongoose.Schema({
    paymentType:{
        type:String
    },
    propertyIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    date:{
        type:String
    },
    amount:{
        type:String
    },
    paymentPlan:{
        type:String
    },
    addedOn:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    }
});
module.exports = mongoose.model('paymentMaster',paymentSchema);