var mongoose = require('mongoose');
var Mixed = mongoose.Schema.Types.Mixed;
propertySchema = mongoose.Schema({
    userIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    vendorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    propertyName:{
        type:String
    },
    description:{
        type:String
    },
    address:{
        type:String
    },
    rent:{
        type:String
    },
    sharing:{
        type:String
    },
    genderType:{
        type:String
    },
    areaName:{
        type:String
    },
    localitySlug:{
        type:String,
        index:true
    },
    cityName:{
        type:String
    },
    stateName:{
        type:String
    },
    latitude:{
        type:Number
    },
    longitude:{
        type:Number
    },
    propertyTypeIDFK:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'propertyType'
    },
    aminityFeatures:{
        type:String
    },
    mealsAvailable:{
        type:[String],
        default:[]
    },
    menuPhoto:{
        type:String
    },
    menuPhotoUrls:{
        type:[String],
        default:[]
    },
    propertyImage:{
        type:String
    },
    propertyImageUrls:{
        type:[String],
        default:[]
    },
    videoUrl:{
        type:String
    },
    propertyCategory:{
        type:String,
        default:"PG"
    },
    propertyType:{
        type:String,
        default:"PG"
    },
    pricingUnit:{
        type:String,
        default:"month"
    },
    dailyRate:{
        type:String
    },
    perDayCheckIn:{
        type:Boolean,
        default:false
    },
    depositAmount:{
        type:String
    },
    availableBeds:{
        type:Number,
        default:0
    },
    roomInventory:{
        type:[{
            sharingType:String,
            totalRooms:{ type:Number, default:0 },
            occupiedRooms:{ type:Number, default:0 },
            vacantRooms:{ type:Number, default:0 },
            bedsPerRoom:{ type:Number, default:1 },
            vacantBeds:{ type:Number, default:0 },
            waitingList:{ type:Number, default:0 },
            bathroom:{ type:String, enum:["attached","shared",""], default:"" },
            balcony:{ type:Boolean, default:false },
            ac:{ type:Boolean, default:false },
            furnishing:{ type:String, enum:["furnished","semi-furnished","unfurnished",""], default:"" },
            foodPreference:{ type:String, enum:["veg","non-veg","both","none",""], default:"" },
            gender:{ type:String, enum:["boys","girls","unisex",""], default:"" },
            monthlyRent:String
        }],
        default:[]
    },
    roomTypes:{
        type:[{
            label:String,
            totalRooms:{ type:Number, default:0 },
            occupiedRooms:{ type:Number, default:0 },
            vacantRooms:{ type:Number, default:0 },
            waitingList:{ type:Number, default:0 },
            bedsPerRoom:{ type:Number, default:1 },
            availableBeds:{ type:Number, default:0 },
            bathroom:{ type:String, enum:["attached","shared",""], default:"" },
            balcony:{ type:Boolean, default:false },
            ac:{ type:Boolean, default:false },
            furnishing:{ type:String, enum:["furnished","semi-furnished","unfurnished",""], default:"" },
            foodPreference:{ type:String, enum:["veg","non-veg","both","none",""], default:"" },
            gender:{ type:String, enum:["boys","girls","unisex",""], default:"" },
            monthlyRent:String
        }],
        default:[]
    },
    customFeatures:{
        type:[String],
        default:[]
    },
    verificationChecklist:{
        identity:Boolean,
        ownership:Boolean,
        photos:Boolean,
        location:Boolean,
        pricing:Boolean,
        safety:Boolean
    },
    vacancyStatus:{
        type:String,
        default:"Available"
    },
    availableFrom:{
        type:String
    },
    sharingAvailability:{
        type:String
    },
    parkingAvailable:{
        type:Boolean,
        default:false
    },
    acAvailable:{
        type:Boolean,
        default:false
    },
    securityFeatures:{
        type:[String],
        default:[]
    },
    nearbyLandmarks:{
        type:[String],
        default:[]
    },
    distanceFromITParks:{
        type:Mixed,
        default:{}
    },
    distanceFromMetro:{
        type:String
    },
    reviewSummary:{
        type:Mixed,
        default:{}
    },
    recommendations:{
        type:Mixed,
        default:{}
    },
    occupancyDetails:{
        type:Mixed,
        default:{}
    },
    commissionConfig:{
        referralCommission:{ type:Number, default:2000 },
        perLeadCharge:{ type:Number, default:20 },
        conversionCharge:{ type:Number, default:2000 },
        cashbackAmount:{ type:Number, default:250 },
        promotionalPricing:{ type:Boolean, default:false },
        notes:String,
        updatedBy:{ type:mongoose.Schema.Types.ObjectId, ref:'userMaster' },
        updatedOn:Date
    },
    assignedAdmin:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'userMaster'
    },
    ownerAgreement:{
        referralAgreementAccepted:{ type:Boolean, default:false },
        leadPricingAccepted:{ type:Boolean, default:false },
        termsAccepted:{ type:Boolean, default:false },
        acceptedOn:Date,
        acceptedBy:{ type:mongoose.Schema.Types.ObjectId, ref:'userMaster' },
        acceptedIp:String,
        acceptedUserAgent:String,
        consentVersion:String,
        consentSource:String
    },
    rating:{
        type:Number,
        default:4.6
    },
    isFeatured:{
        type:Boolean,
        default:false
    },
    isPremium:{
        type:Boolean,
        default:false,
        index:true
    },
    premiumStartDate:{
        type:Date
    },
    premiumEndDate:{
        type:Date
    },
    priority:{
        type:Number,
        default:0,
        index:true
    },
    boostScore:{
        type:Number,
        default:0
    },
    localityPriority:{
        type:Number,
        default:0
    },
    approvalStatus:{
        type:String,
        enum:["Pending","Approved","Rejected","Suspended","Verified"],
        default:"Pending"
    },
    isAvailable:{
        type:Boolean
    },
    addedOn:{
        type:String
    },
    isDummy:{
        type:Boolean,
        default:false,
        index:true
    },
    isVerified:{
        type:Boolean,
        default:false,
        index:true
    },
    photoTypes:{
        type:Mixed,
        default:{}
    },
    honestScore:{
        cleanliness:{ type:Number, default:0 },
        food:{ type:Number, default:0 },
        internet:{ type:Number, default:0 },
        safety:{ type:Number, default:0 },
        computed:{ type:Number, default:0 }
    },
    nearby:{
        metro:{ type:String, default:'' },
        busStop:{ type:String, default:'' },
        hospital:{ type:String, default:'' },
        grocery:{ type:String, default:'' }
    },
    status:{
        type:String,
        enum:["active","archived","demo","suspended"],
        default:"active",
        index:true
    },
    isActive:{
        type:Boolean,
        default:true
    }
});
propertySchema.pre('save', function(next) {
    if (!this.vendorId && this.userIDFK) this.vendorId = this.userIDFK;
    if (!this.userIDFK && this.vendorId) this.userIDFK = this.vendorId;
    if (!this.propertyType && this.propertyCategory) this.propertyType = this.propertyCategory;
    if (!this.propertyCategory && this.propertyType) this.propertyCategory = this.propertyType;
    next();
});

propertySchema.index({ cityName: 1 });
propertySchema.index({ stateName: 1 });
propertySchema.index({ areaName: 1 });
propertySchema.index({ localitySlug: 1 });
propertySchema.index({ cityName: 1, areaName: 1, isActive: 1, approvalStatus: 1 });
propertySchema.index({ vendorId: 1, isActive: 1 });
propertySchema.index({ userIDFK: 1, isActive: 1 });
propertySchema.index({ isDummy: 1 });
propertySchema.index({ isVerified: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ approvalStatus: 1 });
propertySchema.index({ isPremium: -1, priority: -1, addedOn: -1 });
module.exports = mongoose.model('propertyMaster',propertySchema);
