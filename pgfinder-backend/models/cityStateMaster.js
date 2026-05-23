var mongoose = require('mongoose');
var Mixed = mongoose.Schema.Types.Mixed;

cityStateSchema = mongoose.Schema({
    stateName:{
        type:String,
        required:true
    },
    cityName:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    dummyVisible:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["demo","live","paused","archived"],
        default:"demo",
        index:true
    },
    launchedOn:{
        type:Date
    },
    launchReadiness:{
        type:Number,
        default:0
    },
    localities:{
        type:[{
            name:String,
            isActive:{ type:Boolean, default:true },
            dummyVisible:{ type:Boolean, default:false }
        }],
        default:[]
    },
    monetizationRules:{
        type:Mixed,
        default:{}
    },
    operationalScope:{
        type:Mixed,
        default:{}
    },
    assignedAdmins:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'userMaster',
        default:[]
    },
    addedOn:{
        type:Date,
        default:Date.now
    },
    updatedOn:{
        type:Date
    }
});

cityStateSchema.index({ stateName: 1, cityName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
cityStateSchema.index({ cityName: 1 });
cityStateSchema.index({ isActive: 1 });
cityStateSchema.index({ dummyVisible: 1 });

module.exports = mongoose.model('cityStateMaster', cityStateSchema);
