
var mongoose = require('mongoose');
aminitySchema = mongoose.Schema({
    aminityName:{
        type:String
    },
    propertyTypeIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyType'
    },
    addedOn:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    }
});
module.exports = mongoose.model('aminityMaster',aminitySchema);