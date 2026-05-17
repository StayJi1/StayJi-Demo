
var mongoose = require('mongoose');
userRequestSchema = mongoose.Schema({
    propertyIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    sharing:{
        type:String
    },
    noOfRooms:{
        type:String
    },
    refrencebyname:{
        type:String
    },
    refrencecontact:{
        type:String
    },
    userIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    status:{
        type:Boolean
    },
    addedOn:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    }
});
module.exports = mongoose.model('userRequest',userRequestSchema);