
var mongoose = require('mongoose');
visitSchema = mongoose.Schema({
    visitDate:{
        type:String
    },
    visitTime:{
        type:String
    },
    propertyIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    userIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    status:{
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
module.exports = mongoose.model('visitDetails',visitSchema);