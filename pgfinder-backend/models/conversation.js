var mongoose = require('mongoose');

conversationSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster',
        required:true
    },
    ownerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster',
        required:true
    },
    propertyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyMaster'
    },
    participants:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'userMaster',
        default:[]
    },
    conversationType:{
        type:String,
        enum:["user_owner"],
        default:"user_owner"
    },
    status:{
        type:String,
        enum:["active","archived","blocked"],
        default:"active"
    },
    unreadByUser:{
        type:Number,
        default:0
    },
    unreadByOwner:{
        type:Number,
        default:0
    },
    lastMessagePreview:{
        type:String
    },
    lastMessageAt:{
        type:Date
    },
    addedOn:{
        type:Date,
        default:Date.now
    },
    updatedOn:{
        type:Date
    },
    isActive:{
        type:Boolean,
        default:true
    }
});

conversationSchema.pre('save', function(next) {
    this.participants = [this.userId, this.ownerId].filter(Boolean);
    this.updatedOn = new Date();
    next();
});

conversationSchema.index({ userId: 1, ownerId: 1, propertyId: 1, isActive: 1 });
conversationSchema.index({ ownerId: 1, isActive: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, isActive: 1, lastMessageAt: -1 });
conversationSchema.index({ propertyId: 1, isActive: 1 });

module.exports = mongoose.model('conversation', conversationSchema);
