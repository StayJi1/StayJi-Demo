var mongoose = require('mongoose');
areaSchema = mongoose.Schema({
    areaName:{
        type:String
    },
    cityName:{
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
module.exports = mongoose.model('areaMaster',areaSchema);