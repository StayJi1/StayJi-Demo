var mongoose = require('mongoose');
propertyTypeSchema = mongoose.Schema({
    typeName:{
        type:String
    },
    image:{
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
module.exports = mongoose.model('propertyType',propertyTypeSchema);