
var express = require('express');
var router = express.Router();
var multer = require('multer');
var crypto = require('crypto');
var mongoose=require('mongoose');
var Area = require('../models/areaMaster');
var PropertyType = require('../models/propertyType');
var Property = require('../models/propertyMaster');
var User = require('../models/userMaster');
var PropertyImage = require('../models/propertyImage');
var Aminity = require('../models/aminityMaster');
var UserRequest = require("../models/userRequest");
var UserReview = require("../models/userReview");
var Shortlisted = require("../models/shortlistMaster");
var Inquiry = require("../models/inquiryMaster");
var Visit = require("../models/visitDetails");
var Payment = require("../models/paymentMaster");
const { hashPassword, isHashedPassword, verifyPassword } = require('../utils/security');

const parseStringList = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.map((item) => item.toString().trim()).filter(Boolean)
    try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed.map((item) => item.toString().trim()).filter(Boolean)
    } catch (error) {
        // Fall back to comma/newline separated URLs.
    }
    return value.toString().split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
}

const toBoolean = (value) => value === true || value === 'true' || value === 'on' || value === '1'

const toNumberOrUndefined = (value) => {
    if (value === undefined || value === null || value === '') return undefined
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : undefined
}

const normalizeAccountType = (value) => {
    const normalized = (value || '').toString().trim().toLowerCase()
    if (['owner', 'host', 'hostel', 'vendor'].includes(normalized)) return 'vendor'
    if (['personal', 'student', 'user'].includes(normalized)) return 'user'
    if (normalized === 'admin') return 'admin'
    return normalized
}

const propertyPopulate = () => [
    { path: 'userIDFK', select: ['userFname', 'userLname', 'userType', 'userEmail', 'contact'] },
    { path: 'propertyTypeIDFK', select: ['typeName'] },
]

const buildPropertyFilters = (source = {}, includeInactive = false) => {
    const filters = {}
    if (!includeInactive) filters.isActive = true
    if (source.status === 'inactive') filters.isActive = false
    if (source.approvalStatus) filters.approvalStatus = source.approvalStatus
    if (source.cityName || source.city) filters.cityName = new RegExp(source.cityName || source.city, 'i')
    if (source.areaName || source.area) filters.areaName = new RegExp(source.areaName || source.area, 'i')
    if (source.category) filters.propertyCategory = source.category
    if (source.userIDFK) filters.userIDFK = source.userIDFK

    const search = (source.q || source.search || '').trim()
    if (search) {
        const regex = new RegExp(search, 'i')
        filters.$or = [
            { propertyName: regex },
            { description: regex },
            { address: regex },
            { cityName: regex },
            { areaName: regex },
            { propertyCategory: regex },
            { aminityFeatures: regex },
        ]
    }

    return filters
}

const publicPropertyQuery = {
    isActive: true,
    $or: [
        { approvalStatus: "Approved" },
        { approvalStatus: { $exists: false } }
    ]
}


var storage = multer.diskStorage({
    destination: function (req, res, cb) {
        var docimg = req.body.docimg;
        if (docimg == "PropertyImage") {
            cb(null, './public/upload/PropertyImage')
        } else if (docimg == "PropertyTypeImage") {
            cb(null, './public/upload/PropertyTypeImage')
        } else if (docimg == "PropertyImages") {
            cb(null, './public/upload/PropertyImages')
        } else if (docimg == "UserImage") {
            cb(null, './public/upload/UserImage')
        }
        else {
            cb(null, './public/upload')
        }

    },

    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp' || file.mimetype === 'video/mp4' || file.mimetype === 'video/webm' || file.mimetype === 'video/quicktime') {
        cb(null, true);
    } else {
        cb(null, false);
    }

}
var upload = multer({
    storage: storage,

    limits: {
        fileSize: 1024 * 1024 * 20
    },
    fileFilter: fileFilter

});

router.post('/addUser', async (req, res) => {
    const existingUser = await User.findOne({
        userEmail: new RegExp(`^${req.body.userEmail}$`, 'i'),
        isActive: true
    });

    if (existingUser) {
        return res.json({
            result: "failure",
            msg: "User already existed kindly login",
            data: 0
        });
    }

    var objUser = new User();
    objUser.userName = "",
        objUser.userFname = req.body.userFname,
        objUser.userLname = req.body.userLname,
        objUser.userEmail = req.body.userEmail,
        objUser.userPassword = hashPassword(req.body.userPassword),
        objUser.dob = "",
        objUser.gender = req.body.gender,
        objUser.contact = req.body.contact || "",
        objUser.occupation = "",
        objUser.userType = req.body.userType || "User",
        objUser.profile = "",
        objUser.addedOn = new Date(),
        objUser.isActive = true;
    console.log();

    const inserted = await objUser.save();

    if (inserted != null) {
        res.json({ result: "success", msg: "User Inserted", data: 1 });
    } else {
        res.json({ result: "failure", msg: "User Not Inserted", data: 0 });
    }
});

router.post('/googleAuth', async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return res.json({ result: "failure", msg: "Google sign up is not configured", data: 0 });
    }

    if (!req.body.credential || !req.body.contact) {
        return res.json({ result: "failure", msg: "Google account and phone number are required", data: 0 });
    }

    try {
        const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(req.body.credential)}`);
        const googleUser = await verifyResponse.json();

        if (!verifyResponse.ok || googleUser.aud !== clientId || !googleUser.email_verified) {
            return res.json({ result: "failure", msg: "Google verification failed", data: 0 });
        }

        const existingUser = await User.findOne({ userEmail: new RegExp(`^${googleUser.email}$`, 'i'), isActive: true });
        if (existingUser) {
            existingUser.userPassword = undefined;
            return res.json({ result: "success", msg: "login Successfully", data: existingUser });
        }

        const fullName = (googleUser.name || '').trim().split(/\s+/);
        const objUser = new User();
        objUser.userName = googleUser.name || "";
        objUser.userFname = googleUser.given_name || fullName[0] || "";
        objUser.userLname = googleUser.family_name || fullName.slice(1).join(' ') || "";
        objUser.userEmail = googleUser.email;
        objUser.userPassword = hashPassword(crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${googleUser.sub}`);
        objUser.gender = req.body.gender || "";
        objUser.contact = req.body.contact;
        objUser.occupation = "";
        objUser.userType = req.body.userType || "User";
        objUser.profile = googleUser.picture || "";
        objUser.addedOn = new Date();
        objUser.isActive = true;

        const inserted = await objUser.save();
        inserted.userPassword = undefined;
        res.json({ result: "success", msg: "Google signup successful", data: inserted });
    } catch (error) {
        res.json({ result: "failure", msg: "Google verification failed", data: 0 });
    }
});

router.get('/getUserList', async (req, res) => {
    const objUser = await User.find().select('-userPassword');

    if (objUser != null) {
        res.json({ result: "success", msg: "User List Found", data: objUser });

    } else {
        res.json({ result: "failure", msg: "User List Not Found", data: objUser });

    }
});

router.post('/loginByUser', async (req, res) => {

    const objUser = await User.findOne({ userEmail: req.body.userEmail, isActive: true });

    if (objUser != null && verifyPassword(req.body.userPassword, objUser.userPassword)) {
        const actualRole = normalizeAccountType(objUser.userType)
        const requestedRole = normalizeAccountType(req.body.accountType || req.body.role || req.body.userType)
        if (requestedRole && actualRole !== requestedRole) {
            return res.json({ result: "fail", msg: `This account is registered as ${actualRole}. Select the correct account type.`, data: null });
        }
        if (!isHashedPassword(objUser.userPassword)) {
            await User.updateOne({ _id: objUser._id }, { userPassword: hashPassword(req.body.userPassword) })
        }
        objUser.userPassword = undefined
        res.json({ result: "success", msg: "login Successfully", data: objUser });
    }
    else {
        res.json({ result: "fail", msg: "login UnSuccessfuly", data: objUser });
    }
});

router.post('/updateUserPhoto', upload.single('profile'), async (req, res) => {

    console.log("File");
    console.log(req);
    const objUser = await User.updateOne({
        _id: req.body.id
    }, {
        profile: req.file.filename,
    });
    if (objUser != null) {
        res.json({
            result: "success",
            msg: "User Photo Updated",
            data: 1
        });
    } else {
        res.json({
            result: "failure",
            msg: "User Photo Not Updated",
            data: 0
        });
    }
});

router.post('/getUser', async (req, res) => {
    const objUser = await User.findOne({ _id: req.body.id, isActive: true });

    if (objUser != null) {
        res.json({ result: "success", msg: "User Found", data: objUser });

    } else {
        res.json({ result: "failure", msg: "User Not Found", data: objUser });

    }
});

router.post('/authStatus', async (req, res) => {
    if (!req.body.id) {
        return res.json({ result: "failure", msg: "User ID is required", data: null });
    }

    const objUser = await User.findOne({ _id: req.body.id }).select('-userPassword');
    if (!objUser || objUser.isActive === false) {
        return res.json({ result: "inactive", msg: "Account is inactive", data: null });
    }

    res.json({ result: "success", msg: "Account active", data: objUser });
});

router.post('/updateUser', async (req, res) => {
    const updateFields = {}
    if (req.body.userFname !== undefined) updateFields.userFname = req.body.userFname
    if (req.body.userLname !== undefined) updateFields.userLname = req.body.userLname
    if (req.body.userEmail !== undefined) updateFields.userEmail = req.body.userEmail
    if (req.body.contact !== undefined) updateFields.contact = req.body.contact
    if (req.body.occupation !== undefined) updateFields.occupation = req.body.occupation
    if (req.body.gender !== undefined) updateFields.gender = req.body.gender

    const objResult = await User.updateOne({ _id: req.body._id }, { $set: updateFields })
    if (objResult.modifiedCount > 0) {
        const updatedUser = await User.findOne({ _id: req.body._id })
        res.json({ result: "success", msg: "User Updated", data: updatedUser })
    } else {
        const existingUser = await User.findOne({ _id: req.body._id })
        if (existingUser) {
            res.json({ result: "success", msg: "No changes needed", data: existingUser })
        } else {
            res.json({ result: "failure", msg: "User Not Updated", data: null })
        }
    }
});


router.get('/getPropertyList', async (req, res) => {
    const objProperty = await Property.find({ $and: [publicPropertyQuery, buildPropertyFilters(req.query)] }).
        populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName']);
    // var data = [];
    // data["propertyCount"]= objProperty.length;
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/getAreaListByCity', async (req, res) => {
    const objArea = await Area.find({ cityName: req.body.cityName, isActive: true });
    if (objArea != null) {
        res.json({ result: "success", msg: "Area List Found", data: objArea });

    } else {
        res.json({ result: "failure", msg: "Area List Not Found", data: objArea });

    }
});

router.post('/getPropertyByCity', async (req, res) => {
    const objProperty = await Property.find({ cityName: req.body.cityName, ...publicPropertyQuery });
    console.log(objProperty)
    if (objProperty != null) {
        res.json({ result: "success", msg: "PropertyByCity List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "PropertyByCity List Not Found", data: objProperty });

    }
});

router.post('/getPropertyByArea', async (req, res) => {
    const objProperty = await Property.find({ areaName: req.body.areaName, ...publicPropertyQuery });
    console.log(objProperty)
    if (objProperty != null) {
        res.json({ result: "success", msg: "PropertyByArea List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "PropertyByArea List Not Found", data: objProperty });

    }
});

router.post('/getVisitorList', async (req, res) => {
    let objData = [];

    const pipeline =
    [
        {
          '$lookup': {
            'from': 'propertymasters', 
            'localField': 'propertyIDFK', 
            'foreignField': '_id', 
            'as': 'property'
          }
        }, {
          '$addFields': {
            'property': {
              '$arrayElemAt': [
                '$property', 0
              ]
            }
          }
        }, {
          '$lookup': {
            'from': 'usermasters', 
            'localField': 'userIDFK', 
            'foreignField': '_id', 
            'as': 'visituser'
          }
        }, {
          '$addFields': {
            'visituser': {
              '$arrayElemAt': [
                '$visituser', 0
              ]
            }
          }
        }, {
          '$lookup': {
            'from': 'usermasters', 
            'localField': 'property.userIDFK', 
            'foreignField': '_id', 
            'as': 'user'
          }
        }, {
          '$addFields': {
            'user': {
              '$arrayElemAt': [
                '$user', 0
              ]
            }
          }
        }, {
          '$match': {
            'user._id': mongoose.Types.ObjectId(req.body.userIDFK),
          }
        }, {
          '$unset': ['visituser.userPassword', 'user.userPassword']
        }
      ]
        ;
    const aggCursor = Visit.aggregate(pipeline);
    for await (const doc of aggCursor) {
        objData.push(doc);
    }



    if (objData != null) {
        res.json({
            result: "success",
            msg: "Visit List Found",
            data: objData
        });
    } else {
        res.json({
            result: "failure",
            msg: "Visit List Not Found",
            data: objData
        });
    }
});

// router.post('/getVisitorList', async (req, res) => {

//     console.log(req.body.userIDFK);
//     const objProperty = await Property.find({ userIDFK: req.body.userIDFK });

//     console.log(objProperty);
//     var objdata = [];
//     for (const element of objProperty) {
//         const objVisit = await Visit.find({ propertyIDFK: element._id, isActive: true }).
//             populate({
//                 path: 'userIDFK',
//                 model: 'userMaster', 
//                 select: ['userType', 'userFname', 'contact', 'userLname']
//             })
//             .populate({
//                 path: 'propertyIDFK',
//                 model: 'propertyMaster',
//                 select: ['propertyName', 'userIDFK'],
//                 populate: [{
//                     path: 'userIDFK',
//                     model: 'userMaster',
//                     select: ['userType', 'userFname', 'contact', 'userLname']
//                 }]

//             });
            
//         objdata.push(objVisit);
//     }
//     if (objdata != null) {
//         res.json({ result: "success", msg: "Visitor List Found", data: objdata });

//     } else {
//         res.json({ result: "failure", msg: "Visitor List Not Found", data: objdata });

//     }
// });

router.post('/getVisitorListStatus', async (req, res) => {
    const objVisit = await Visit.find({ userIDFK: req.body.userIDFK, isActive: true, status: "1" }).
        populate('userIDFK', ['userFname', 'userLname', 'userType']).populate('propertyIDFK', ['propertyName']);
    // var data = [];
    // data["propertyCount"]= objProperty.length;
    console.log(req.body.userIDFK);
    if (objVisit != null) {
        res.json({ result: "success", msg: "Visitor List Found", data: objVisit });

    } else {
        res.json({ result: "failure", msg: "Visitor List Not Found", data: objVisit });

    }
});


router.post('/getVisitById', async (req, res) => {
    const objVisit = await Visit.find({ userIDFK: req.body.userIDFK, isActive: true }).
        populate('userIDFK', ['userFname', 'userLname']).populate('propertyIDFK', ['propertyName']);
    if (objVisit != null) {
        res.json({ result: "success", msg: "Visitor List Found", data: objVisit });

    } else {
        res.json({ result: "failure", msg: "Visitor List Not Found", data: objVisit });

    }
});

router.post('/getInquiryById', async (req, res) => {
    const objInquiry = await Inquiry.find({ userIDFK: req.body.userIDFK, isActive: true }).
        populate('userIDFK', ['userType', 'userFname', 'contact', 'userLname'])
        .populate({
            path: 'propertyIDFK',
            model: 'propertyMaster',
            select: ['propertyName', 'userIDFK'],
            populate: [{
                path: 'userIDFK',
                model: 'userMaster',
                select: ['userType', 'userFname', 'contact', 'userLname']
            }]

        });
    if (objInquiry != null) {
        res.json({ result: "success", msg: "Inquiry List Found", data: objInquiry });

    } else {
        res.json({ result: "failure", msg: "Inquiry List Not Found", data: objInquiry });

    }
});

router.post('/getInquiry', async (req, res) => {
    let objData = [];

    const pipeline =
    [
        {
            '$lookup': {
                'from': 'propertymasters', 
                'localField': 'propertyIDFK', 
                'foreignField': '_id', 
                'as': 'property'
            }
        }, {
            '$addFields': {
                'property': {
                    '$arrayElemAt': [
                        '$property', 0
                    ]
                }
            }
        }, {
            '$lookup': {
                'from': 'usermasters', 
                'localField': 'property.userIDFK', 
                'foreignField': '_id', 
                'as': 'user'
            }
        }, {
            '$addFields': {
                'user': {
                    '$arrayElemAt': [
                        '$user', 0
                    ]
                }
            }
        }, {
            '$lookup': {
                'from': 'usermasters', 
                'localField': 'userIDFK', 
                'foreignField': '_id', 
                'as': 'inquiryuser'
            }
        }, {
            '$addFields': {
                'inquiryuser': {
                    '$arrayElemAt': [
                        '$inquiryuser', 0
                    ]
                }
            }
        }, {
            '$match': {
                'user._id': mongoose.Types.ObjectId(req.body.userIDFK),
            }
        }, {
            '$unset': ['inquiryuser.userPassword', 'user.userPassword']
        }
    ]
        ;
    const aggCursor = Inquiry.aggregate(pipeline);
    for await (const doc of aggCursor) {
        objData.push(doc);
    }



    if (objData != null) {
        res.json({
            result: "success",
            msg: "Inquiry List Found",
            data: objData
        });
    } else {
        res.json({
            result: "failure",
            msg: "Inquiry List Not Found",
            data: objData
        });
    }
});

// router.get('/getInquiry', async (req, res) => {
//     const objInquiry = await Inquiry.find({ isActive: true }).
//         populate('userIDFK', ['userFname', 'userLname']).populate('propertyIDFK', ['propertyName']);
//     if (objInquiry != null) {
//         res.json({ result: "success", msg: "Inquiry List Found", data: objInquiry });

//     } else {
//         res.json({ result: "failure", msg: "Inquiry List Not Found", data: objInquiry });

//     }
// });


router.post('/getPropertyById', async (req, res) => {
    const filters = req.body.includePrivate
        ? { _id: req.body.id }
        : { _id: req.body.id, ...publicPropertyQuery }
    const objProperty = await Property.findOne(filters).
        populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName']);
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/getPropertyByUserId', async (req, res) => {
    const objProperty = await Property.findOne({ userIDFK: req.body.id, isActive: true }).
        populate('userIDFK', ['userFname', 'userLname']).populate('propertyTypeIDFK', ['typeName']);
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/getAminityById', async (req, res) => {
    const objAminity = await Aminity.find({ propertyTypeIDFK: req.body.propertyTypeIDFK, isActive: true })
    if (objAminity != null) {
        res.json({ result: "success", msg: "Aminity List Found", data: objAminity });

    } else {
        res.json({ result: "failure", msg: "Aminity List Not Found", data: objAminity });

    }
});


router.post('/getPropertyImageById', async (req, res) => {
    const objImage = await PropertyImage.find({ propertyIDFK: req.body.propertyIDFK, isActive: true })
        .populate('propertyIDFK', ['propertyName'])
    if (objImage != null) {
        res.json({ result: "success", msg: "PropertyImage List Found", data: objImage });

    } else {
        res.json({ result: "failure", msg: "PropertyImage List Not Found", data: objImage });

    }
});

router.post('/getReviewById', async (req, res) => {
    const objReview = await UserReview.find({ propertyIDFK: req.body.propertyIDFK, isActive: true }).
        populate('userIDFK', ['userFname', 'userLname']).populate('propertyIDFK', ['propertyName'])
    if (objReview != null) {
        res.json({ result: "success", msg: "Review List Found", data: objReview });

    } else {
        res.json({ result: "failure", msg: "Review List Not Found", data: objReview });

    }
});

router.post('/updateUser', async (req, res) => {

    const objUser = await User.updateOne({ _id: req.body.id }, {
        userName: req.body.userName,
        userFname: req.body.userFname,
        userLname: req.body.userLname,
        userEmail: req.body.userEmail,
        //userPassword : req.body.userPassword,
        dob: req.body.dob,
        gender: req.body.gender,
        contact: req.body.contact,
        occupation: req.body.occupation,
        //userType : req.body.userType,
        // profile : req.file.filename,
    });
    // res.send(objStudent);
    if (objUser != null) {
        res.json({ result: "success", msg: "User updated Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

router.post('/getShortlistById', async (req, res) => {
    const objShort = await Shortlisted.find({ userIDFK: req.body.userIDFK, isActive: true })
        .populate('userIDFK', ['userFname', 'userLname'])
        .populate('propertyIDFK', ['propertyName', 'propertyImage', 'rent', 'address', 'areaName', 'isActive', 'approvalStatus']);

    if (objShort != null) {
        const visibleShortlist = objShort.filter((item) => item.propertyIDFK && item.propertyIDFK.isActive !== false && (item.propertyIDFK.approvalStatus || 'Approved') === 'Approved');
        res.json({ result: 'success', msg: 'ShortList Found', data: visibleShortlist });
    } else {
        res.json({ result: 'failure', msg: 'ShortList Not Found', data: objShort });
    }
});

router.post('/getShortlistByVendor', async (req, res) => {
    if (!req.body.userIDFK) {
        return res.json({ result: 'failure', msg: 'Vendor user ID is required', data: [] });
    }

    const properties = await Property.find({ userIDFK: req.body.userIDFK, isActive: true }).select('_id');
    const propertyIds = properties.map((property) => property._id);

    if (!propertyIds.length) {
        return res.json({ result: 'success', msg: 'No shortlist activity found', data: [] });
    }

    const shortlistSummary = await Shortlisted.aggregate([
        { $match: { propertyIDFK: { $in: propertyIds }, isActive: true } },
        { $group: { _id: '$propertyIDFK', wishlistCount: { $sum: 1 }, latestActivity: { $max: '$addedOn' } } },
        { $lookup: { from: 'propertymasters', localField: '_id', foreignField: '_id', as: 'property' } },
        { $unwind: '$property' },
        {
            $project: {
                _id: 0,
                propertyId: '$_id',
                wishlistCount: 1,
                latestActivity: 1,
                property: {
                    _id: '$property._id',
                    propertyName: '$property.propertyName',
                    rent: '$property.rent',
                    address: '$property.address',
                    areaName: '$property.areaName',
                    cityName: '$property.cityName',
                    approvalStatus: '$property.approvalStatus',
                    isActive: '$property.isActive',
                },
            },
        },
    ]);

    const visibleShortlist = shortlistSummary.filter((item) => item.property && item.property.isActive !== false && (item.property.approvalStatus || 'Approved') === 'Approved');
    res.json({ result: 'success', msg: 'Shortlist analytics found', data: visibleShortlist });
});

router.post('/getShortlistByPropertyId', async (req, res) => {
    if (req.body.userIDFK == "" || req.body.propertyIDFK == "") {
        res.json({
            result: "failure",
            msg: "user id or property id Not Found",
            data: 0
        });
    }
    else {
        const objShortlist = await Shortlisted.findOne({
            userIDFK: req.body.userIDFK,
            propertyIDFK: req.body.propertyIDFK,
            isActive: true
        }).populate('userIDFK', ['userFname', 'userLname'])
            .populate('propertyIDFK', ['propertyName', 'propertyImage', 'rent', 'address', 'areaName'])

        if (objShortlist != null) {
            res.json({
                result: "success",
                msg: "shortlist Found",
                data: objShortlist
            });
        } else {
            res.json({
                result: "failure",
                msg: "shortlist Not Found",
                data: objShortlist
            });
        }
    }


});

router.post('/addInquiry', async (req, res) => {
    var objInquiry = new Inquiry({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK });
    objInquiry.propertyIDFK = req.body.propertyIDFK,
        objInquiry.subject = req.body.subject,
        objInquiry.description = req.body.description,
        objInquiry.userIDFK = req.body.userIDFK,
        objInquiry.reply = "",
        objInquiry.status = false,
        objInquiry.addedOn = new Date(),
        objInquiry.isActive = true;

    const inserted = await objInquiry.save();

    if (inserted != null) {
        res.json({ result: "success", msg: "Inquiry Inserted", data: 1 });
    } else {
        res.json({ result: "failure", msg: "Inquiry Not Inserted", data: 0 });
    }
});

router.post('/addInterest', async (req, res) => {
    const objInquiry = new Inquiry({
        propertyIDFK: req.body.propertyIDFK,
        subject: req.body.subject || 'Property interest',
        description: req.body.description || 'A user has expressed interest in this property.',
        preferredVisitTime: req.body.preferredVisitTime || req.body.visitTime || '',
        moveInPreference: req.body.moveInPreference || '',
        leadStage: 'qualified',
        isConverted: false,
        userIDFK: req.body.userIDFK,
        reply: '',
        status: false,
        addedOn: new Date(),
        isActive: true,
    });

    const inserted = await objInquiry.save();

    if (inserted != null) {
        res.json({ result: 'success', msg: 'Interest submitted', data: 1 });
    } else {
        res.json({ result: 'failure', msg: 'Interest could not be submitted', data: 0 });
    }
});

router.post('/addPropertyImages', upload.single('propertyImage'), async (req, res) => {

    const objPropertyImage = new PropertyImage();
    objPropertyImage.propertyIDFK = req.body.propertyIDFK,
        console.log("id" + req.body.propertyIDFK);
    objPropertyImage.image = req.file.filename,
        objPropertyImage.addedOn = new Date(),
        objPropertyImage.isActive = true
    await objPropertyImage.save();

    res.json({ result: "success", msg: "Images Inserted", data: 1 });
});

router.post('/addVisit', async (req, res) => {
    var objVisit = new Visit({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK });
    objVisit.visitDate = req.body.visitDate,
        objVisit.visitTime = req.body.visitTime || "-",
        objVisit.moveInPreference = req.body.moveInPreference || "",
        objVisit.leadStage = "qualified",
        objVisit.isConverted = false,
        objVisit.userIDFK = req.body.userIDFK,
        objVisit.propertyIDFK = req.body.propertyIDFK,
        objVisit.status = "0",
        objVisit.addedOn = new Date(),
        objVisit.isActive = true;
    console.log();

    const inserted = await objVisit.save();

    if (inserted != null) {
        res.json({ result: "success", msg: "Visit Inserted", data: 1 });
    } else {
        res.json({ result: "failure", msg: "Visit Not Inserted", data: 0 });
    }
});

router.post('/markLeadConverted', async (req, res) => {
    const allowedTypes = ['visit', 'inquiry']
    if (!allowedTypes.includes(req.body.type) || !req.body.id) {
        return res.json({ result: 'failure', msg: 'Lead type and ID are required', data: 0 })
    }

    const Model = req.body.type === 'visit' ? Visit : Inquiry
    const updated = await Model.updateOne({ _id: req.body.id }, { isConverted: true, leadStage: 'converted' })
    if (updated.modifiedCount > 0) {
        return res.json({ result: 'success', msg: 'Lead marked as converted', data: 1 })
    }
    res.json({ result: 'failure', msg: 'Lead conversion was not updated', data: 0 })
});

router.post('/addReview', async (req, res) => {
    var objReview = new UserReview({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK });
    objReview.propertyIDFK = req.body.propertyIDFK,
        objReview.details = req.body.details,
        objReview.rating = req.body.rating,
        objReview.userIDFK = req.body.userIDFK,
        objReview.addedOn = new Date(),
        objReview.isActive = true;
    console.log();

    const inserted = await objReview.save();

    if (inserted != null) {
        res.json({ result: "success", msg: "User Inserted", data: 1 });
    } else {
        res.json({ result: "failure", msg: "User Not Inserted", data: 0 });
    }
});

router.post('/addShortlist', async (req, res) => {
    let objShortlist = await Shortlisted.findOne({
        userIDFK: req.body.userIDFK,
        propertyIDFK: req.body.propertyIDFK,
    });

    if (objShortlist != null) {
        if (objShortlist.isActive) {
            return res.json({
                result: 'success',
                msg: 'Property already shortlisted',
                data: 1,
            });
        }

        objShortlist.isActive = true;
        objShortlist.addedOn = new Date();
        await objShortlist.save();

        return res.json({
            result: 'success',
            msg: 'Shortlist reactivated successfully',
            data: 1,
        });
    }

    objShortlist = new Shortlisted();
    objShortlist.userIDFK = req.body.userIDFK;
    objShortlist.propertyIDFK = req.body.propertyIDFK;
    objShortlist.isActive = true;
    objShortlist.addedOn = new Date();
    const inserted = await objShortlist.save();

    if (inserted != null) {
        res.json({
            result: 'success',
            msg: 'Shortlist Inserted Successfully',
            data: 1,
        });
    } else {
        res.json({
            result: 'failure',
            msg: 'UnSuccessful',
            data: 0,
        });
    }
});

const removeShortlist = async (req, res) => {

    const objShortlist = await Shortlisted.updateOne({
        propertyIDFK: req.body.propertyIDFK,
        userIDFK: req.body.userIDFK,
        isActive: true
    }, { isActive: false });
    if (objShortlist != null) {
        res.json({
            result: "success",
            msg: "Shortlist updated Successfully",
            data: 1
        });
    } else {
        res.json({
            result: "failure",
            msg: "UnSuccessful",
            data: 0
        });
    }
}

router.delete('/deleteShortlist', removeShortlist);
router.post('/deleteShortlist', removeShortlist);

router.get('/getPropertyType', async (req, res) => {
    const objtype = await PropertyType.find({ isActive: true });
    console.log(objtype)
    if (objtype != null) {
        res.json({ result: "success", msg: "PropertyType List Found", data: objtype });

    } else {
        res.json({ result: "failure", msg: "PropertyType List Not Found", data: objtype });

    }
});

router.post('/addProperty', upload.fields([{ name: 'propertyImage', maxCount: 10 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    const imageUrls = parseStringList(req.body.propertyImageUrls)
    const mealsAvailable = parseStringList(req.body.mealsAvailable || req.body.foodOptions)
    const menuPhotoUrls = parseStringList(req.body.menuPhotoUrls)
    const uploadedImages = (req.files?.propertyImage || []).map((file) => file.filename)
    const uploadedVideo = req.files?.video?.[0]?.filename || ''
    const primaryImage = uploadedImages[0]
        ? uploadedImages[0]
        : (req.body.propertyImage || imageUrls[0] || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80')
    var objProperty = new Property({ userIDFK: req.body.userIDFK });
    objProperty.userIDFK = req.body.userIDFK,
        objProperty.propertyName = req.body.propertyName,
        objProperty.description = req.body.description,
        objProperty.address = req.body.address,
        objProperty.rent = req.body.rent,
        objProperty.sharing = req.body.sharing,
        objProperty.genderType = req.body.genderType,
        objProperty.areaName = req.body.areaName,
        objProperty.cityName = req.body.cityName,
        objProperty.latitude = toNumberOrUndefined(req.body.latitude),
        objProperty.longitude = toNumberOrUndefined(req.body.longitude),
        objProperty.aminityFeatures = req.body.aminityFeatures || "",
        objProperty.mealsAvailable = mealsAvailable,
        objProperty.menuPhoto = req.body.menuPhoto || menuPhotoUrls[0] || "",
        objProperty.menuPhotoUrls = menuPhotoUrls,
        objProperty.propertyImage = primaryImage,
        objProperty.propertyImageUrls = [...uploadedImages, ...imageUrls].length ? [...uploadedImages, ...imageUrls] : [primaryImage],
        objProperty.videoUrl = uploadedVideo || req.body.videoUrl || "",
        objProperty.depositAmount = req.body.depositAmount || "",
        objProperty.availableBeds = toNumberOrUndefined(req.body.availableBeds) || 0,
        objProperty.vacancyStatus = req.body.vacancyStatus || "Available",
        objProperty.availableFrom = req.body.availableFrom || "",
        objProperty.sharingAvailability = req.body.sharingAvailability || "",
        objProperty.parkingAvailable = toBoolean(req.body.parkingAvailable),
        objProperty.acAvailable = toBoolean(req.body.acAvailable),
        objProperty.rating = toNumberOrUndefined(req.body.rating) || 4.6,
        objProperty.propertyCategory = req.body.propertyCategory || req.body.propertySegment || "PG",
        objProperty.pricingUnit = req.body.pricingUnit || "month",
        objProperty.dailyRate = req.body.dailyRate || "",
        objProperty.perDayCheckIn = toBoolean(req.body.perDayCheckIn),
        objProperty.isAvailable = true,
        objProperty.addedOn = new Date(),
        objProperty.isActive = true,
        objProperty.approvalStatus = "Pending"
    if (req.body.propertyTypeIDFK) {
        objProperty.propertyTypeIDFK = req.body.propertyTypeIDFK
    }

    const inserted = await objProperty.save();

    const objUser = await User.updateOne({
        _id: req.body.userIDFK
    },
        {
            userType: "Owner"
        });

    if (inserted != null) {
        res.json({ result: "success", msg: "Property Inserted", data: inserted._id });
    } else {
        res.json({ result: "failure", msg: "Property Not Inserted", data: 0 });
    }

});


router.post('/resetPassword', async (req, res) => {

    const objUser = await User.updateOne({ userEmail: req.body.userEmail }, {
        userPassword: hashPassword(req.body.userPassword),
    });
    if (objUser != null) {
        res.json({ result: "success", msg: "Password reset Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

router.post('/updateVisitTime', async (req, res) => {
    const objVisit = await Visit.updateOne({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK }, {
        userIDFK: req.body.userIDFK,
        propertyIDFK: req.body.propertyIDFK,
        visitTime: req.body.visitTime,
        status: "1"
    });
    // res.send(objUser);

    if (objVisit != null) {
        res.json({ result: "success", msg: "Visit Time update Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

router.post('/updateVisitStatus', async (req, res) => {
    const objVisit = await Visit.updateOne({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK }, {
        userIDFK: req.body.userIDFK,
        propertyIDFK: req.body.propertyIDFK,
        status: "2"
    });
    if (objVisit != null) {
        res.json({ result: "success", msg: "Visit status update Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

router.post('/updateAminityFeature', async (req, res) => {

    const objProperty = await Property.updateOne({
        _id: req.body.id,
    },
        {
            aminityFeatures: req.body.aminityFeatures,
        });
    if (objProperty != null) {
        res.json({ result: "success", msg: "Aminity Features update Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

router.post('/updateReply', async (req, res) => {
    const objInquiry = await Inquiry.updateOne({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK }, {
        userIDFK: req.body.userIDFK,
        propertyIDFK: req.body.propertyIDFK,
        reply: req.body.reply,
        status: true
    });
    if (objInquiry != null) {
        res.json({ result: "success", msg: "Inquiry update Successfully", data: 1 });

    } else {
        res.json({ result: "failure", msg: "UnSuccessful", data: 0 });

    }
});

var nodemailer = require('nodemailer');
router.post('/getemailbydata', async (req, res) => {
    objUser = await User.findOne({
        userEmail: req.body.userEmail,
        isActive: true
    });
    var transporter = nodemailer.createTransport({
        host: 'mail.metanoiainfotech.com',
        port: 465,
        secure: true,
        auth: {
            user: 'contact@metanoiainfotech.com',
            pass: 'Metanoia@#$%!2018'
        }
    });

    var mailOptions = {
        from: 'contact@metanoiainfotech.com',
        to: req.body.userEmail,
        subject: 'Sending OTP',
        text: Math.floor(1000 + Math.random() * 9000).toString()
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    res.json({
        result: "success",
        msg: "otp  Found",
        data: mailOptions.text
    });
});


router.post('/getPropertyListByUser', async (req, res) => {
    const objProperty = await Property.find(buildPropertyFilters(req.body)).
        populate(propertyPopulate());
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });
    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });
    }
});

router.get('/getAllPropertyList', async (req, res) => {
    const objProperty = await Property.find(buildPropertyFilters(req.query)).
        populate(propertyPopulate());
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });
    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });
    }
});

router.post('/reviewProperty', async (req, res) => {
    const allowedStatuses = ["Pending", "Approved", "Rejected"]
    if (!allowedStatuses.includes(req.body.approvalStatus)) {
        return res.json({ result: "failure", msg: "Invalid approval status", data: 0 })
    }

    const updated = await Property.updateOne(
        { _id: req.body.id },
        { approvalStatus: req.body.approvalStatus }
    )

    if (updated.modifiedCount > 0) {
        const objProperty = await Property.findOne({ _id: req.body.id, isActive: true }).
            populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName'])
        res.json({ result: "success", msg: "Property review updated", data: objProperty })
    } else {
        res.json({ result: "failure", msg: "Property review not updated", data: 0 })
    }
})

router.post('/reactivateProperty', async (req, res) => {
    const objUpdateProperty = await Property.updateOne({ _id: req.body.id }, { isActive: true, approvalStatus: "Pending" })
    if (objUpdateProperty.modifiedCount > 0) {
        const objProperty = await Property.findOne({ _id: req.body.id }).populate(propertyPopulate())
        res.json({ result: "success", msg: "Property reactivated and moved to pending review", data: objProperty })
    } else {
        res.json({ result: "failure", msg: "Property could not be reactivated", data: 0 })
    }
})

router.post('/updateProperty', async (req, res) => {
    const updateFields = {}
    if (req.body.propertyName !== undefined) updateFields.propertyName = req.body.propertyName
    if (req.body.description !== undefined) updateFields.description = req.body.description
    if (req.body.address !== undefined) updateFields.address = req.body.address
    if (req.body.rent !== undefined) updateFields.rent = req.body.rent
    if (req.body.sharing !== undefined) updateFields.sharing = req.body.sharing
    if (req.body.genderType !== undefined) updateFields.genderType = req.body.genderType
    if (req.body.areaName !== undefined) updateFields.areaName = req.body.areaName
    if (req.body.cityName !== undefined) updateFields.cityName = req.body.cityName
    if (req.body.latitude !== undefined) updateFields.latitude = toNumberOrUndefined(req.body.latitude)
    if (req.body.longitude !== undefined) updateFields.longitude = toNumberOrUndefined(req.body.longitude)
    if (req.body.aminityFeatures !== undefined) updateFields.aminityFeatures = req.body.aminityFeatures
    if (req.body.mealsAvailable !== undefined || req.body.foodOptions !== undefined) updateFields.mealsAvailable = parseStringList(req.body.mealsAvailable || req.body.foodOptions)
    if (req.body.menuPhoto !== undefined) updateFields.menuPhoto = req.body.menuPhoto
    if (req.body.menuPhotoUrls !== undefined) {
        const menuPhotoUrls = parseStringList(req.body.menuPhotoUrls)
        updateFields.menuPhotoUrls = menuPhotoUrls
        if (!updateFields.menuPhoto && menuPhotoUrls.length) updateFields.menuPhoto = menuPhotoUrls[0]
    }
    if (req.body.propertyImage !== undefined) updateFields.propertyImage = req.body.propertyImage
    if (req.body.propertyImageUrls !== undefined) {
        const imageUrls = parseStringList(req.body.propertyImageUrls)
        updateFields.propertyImageUrls = imageUrls
        if (!updateFields.propertyImage && imageUrls.length) updateFields.propertyImage = imageUrls[0]
    }
    if (req.body.videoUrl !== undefined) updateFields.videoUrl = req.body.videoUrl
    if (req.body.depositAmount !== undefined) updateFields.depositAmount = req.body.depositAmount
    if (req.body.availableBeds !== undefined) updateFields.availableBeds = toNumberOrUndefined(req.body.availableBeds) || 0
    if (req.body.vacancyStatus !== undefined) updateFields.vacancyStatus = req.body.vacancyStatus
    if (req.body.availableFrom !== undefined) updateFields.availableFrom = req.body.availableFrom
    if (req.body.sharingAvailability !== undefined) updateFields.sharingAvailability = req.body.sharingAvailability
    if (req.body.parkingAvailable !== undefined) updateFields.parkingAvailable = toBoolean(req.body.parkingAvailable)
    if (req.body.acAvailable !== undefined) updateFields.acAvailable = toBoolean(req.body.acAvailable)
    if (req.body.rating !== undefined) updateFields.rating = toNumberOrUndefined(req.body.rating) || 4.6
    if (req.body.propertyCategory !== undefined) updateFields.propertyCategory = req.body.propertyCategory
    if (req.body.propertySegment !== undefined) updateFields.propertyCategory = req.body.propertySegment
    if (req.body.pricingUnit !== undefined) updateFields.pricingUnit = req.body.pricingUnit
    if (req.body.dailyRate !== undefined) updateFields.dailyRate = req.body.dailyRate
    if (req.body.perDayCheckIn !== undefined) updateFields.perDayCheckIn = toBoolean(req.body.perDayCheckIn)
    if (req.body.propertyTypeIDFK !== undefined) updateFields.propertyTypeIDFK = req.body.propertyTypeIDFK
    if (req.body.approvalStatus !== undefined) updateFields.approvalStatus = req.body.approvalStatus
    else updateFields.approvalStatus = "Pending"
    if (req.body.isAvailable !== undefined) {
        updateFields.isAvailable = req.body.isAvailable === 'false' ? false : req.body.isAvailable === 'true' ? true : req.body.isAvailable
    }

    const updated = await Property.updateOne({ _id: req.body.id }, { $set: updateFields })
    if (updated.modifiedCount > 0) {
        const objProperty = await Property.findOne({ _id: req.body.id, isActive: true }).populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName'])
        res.json({ result: "success", msg: "Property Updated", data: objProperty })
    } else {
        const existingProperty = await Property.findOne({ _id: req.body.id, isActive: true })
        if (existingProperty) {
            res.json({ result: "success", msg: "No changes made", data: existingProperty })
        } else {
            res.json({ result: "failure", msg: "Property Not Updated", data: null })
        }
    }
})

router.post('/deleteProperty', async (req, res) => {
    const objDeleteProperty = await Property.updateOne({ _id: req.body.id }, { isActive: false })
    if (objDeleteProperty.modifiedCount > 0) {
        res.json({ result: "success", msg: "Property deleted successfully", data: 1 })
    } else {
        res.json({ result: "failure", msg: "Property could not be deleted", data: 0 })
    }
})

router.get('/getAdminStats', async (req, res) => {
    const [users, vendors, activeProperties, inactiveProperties, inquiries, pendingProperties, visitLeads, convertedVisits, convertedInquiries] = await Promise.all([
        User.countDocuments({ isActive: true, userType: { $ne: "Admin" } }),
        User.countDocuments({ isActive: true, userType: { $in: ["Vendor", "Owner", "vendor", "owner"] } }),
        Property.countDocuments({ isActive: true }),
        Property.countDocuments({ isActive: false }),
        Inquiry.countDocuments({ isActive: true }),
        Property.countDocuments({ isActive: true, approvalStatus: "Pending" }),
        Visit.countDocuments({ isActive: true }),
        Visit.countDocuments({ isActive: true, isConverted: true }),
        Inquiry.countDocuments({ isActive: true, isConverted: true }),
    ])

    res.json({
        result: "success",
        msg: "Admin stats found",
        data: { users, vendors, properties: activeProperties, inactiveProperties, inquiries, pendingProperties, leads: inquiries + visitLeads, conversions: convertedVisits + convertedInquiries },
    })
})

router.get('/getAdminVendorLeadSummary', async (req, res) => {
    const [visitSummary, inquirySummary] = await Promise.all([
        Visit.aggregate([
            { $match: { isActive: true } },
            { $lookup: { from: 'propertymasters', localField: 'propertyIDFK', foreignField: '_id', as: 'property' } },
            { $unwind: '$property' },
            { $group: { _id: '$property.userIDFK', visitCount: { $sum: 1 } } },
            { $lookup: { from: 'usermasters', localField: '_id', foreignField: '_id', as: 'vendor' } },
            { $unwind: '$vendor' },
            { $project: { _id: 0, vendorId: '$_id', visitCount: 1, vendor: { _id: '$vendor._id', name: '$vendor.userFname', email: '$vendor.userEmail', contact: '$vendor.contact' } } },
        ]),
        Inquiry.aggregate([
            { $match: { isActive: true } },
            { $lookup: { from: 'propertymasters', localField: 'propertyIDFK', foreignField: '_id', as: 'property' } },
            { $unwind: '$property' },
            { $group: { _id: '$property.userIDFK', inquiryCount: { $sum: 1 } } },
            { $lookup: { from: 'usermasters', localField: '_id', foreignField: '_id', as: 'vendor' } },
            { $unwind: '$vendor' },
            { $project: { _id: 0, vendorId: '$_id', inquiryCount: 1, vendor: { _id: '$vendor._id', name: '$vendor.userFname', email: '$vendor.userEmail', contact: '$vendor.contact' } } },
        ]),
    ])

    const summaryMap = new Map()
    visitSummary.forEach((item) => {
        summaryMap.set(item.vendorId.toString(), { vendor: item.vendor, visitCount: item.visitCount, inquiryCount: 0 })
    })
    inquirySummary.forEach((item) => {
        const key = item.vendorId.toString()
        const existing = summaryMap.get(key)
        if (existing) {
            existing.inquiryCount = item.inquiryCount
        } else {
            summaryMap.set(key, { vendor: item.vendor, visitCount: 0, inquiryCount: item.inquiryCount })
        }
    })

    const vendorLeads = Array.from(summaryMap.values()).map((item) => ({
        vendor: item.vendor,
        visitCount: item.visitCount,
        inquiryCount: item.inquiryCount,
        totalLeads: item.visitCount + item.inquiryCount,
    }))

    res.json({ result: 'success', msg: 'Vendor lead summary found', data: { totalLeads: vendorLeads.reduce((sum, item) => sum + item.totalLeads, 0), vendors: vendorLeads } })
})

router.get('/getAdminUsers', async (req, res) => {
    const filters = {}
    if (req.query.status === 'inactive') filters.isActive = false
    else if (req.query.status !== 'all') filters.isActive = true
    if (req.query.role && req.query.role !== 'all') filters.userType = new RegExp(`^${req.query.role}$`, 'i')

    const search = (req.query.search || '').trim()
    if (search) {
        const regex = new RegExp(search, 'i')
        filters.$or = [
            { userFname: regex },
            { userLname: regex },
            { userEmail: regex },
            { contact: regex },
            { occupation: regex },
        ]
    }

    const users = await User.find(filters).select('-userPassword').sort({ addedOn: -1 })
    res.json({ result: "success", msg: "Admin users found", data: users })
})

router.post('/updateUserStatus', async (req, res) => {
    const updateFields = {}
    if (req.body.isActive !== undefined) updateFields.isActive = req.body.isActive === true || req.body.isActive === 'true'
    if (req.body.userType !== undefined) updateFields.userType = req.body.userType

    const updated = await User.updateOne({ _id: req.body.id }, { $set: updateFields })
    if (updated.modifiedCount > 0) {
        const user = await User.findOne({ _id: req.body.id }).select('-userPassword')
        res.json({ result: "success", msg: "User updated", data: user })
    } else {
        res.json({ result: "failure", msg: "User was not updated", data: 0 })
    }
})

router.post('/getPropertyListByType', async (req, res) => {
    const objProperty = await Property.find({ propertyTypeIDFK: req.body.propertyTypeIDFK, ...publicPropertyQuery }).
        populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName']);;
    // var data = [];
    // data["propertyCount"]= objProperty.length;
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/getPropertyListByTypeId', async (req, res) => {
    const objProperty = await Property.find({ userIDFK: req.body.userIDFK, propertyTypeIDFK: req.body.propertyTypeIDFK, isActive: true }).
        populate('userIDFK', ['userFname', 'userLname', 'userType', 'contact']).populate('propertyTypeIDFK', ['typeName']);;
    // var data = [];
    // data["propertyCount"]= objProperty.length;
    if (objProperty != null) {
        res.json({ result: "success", msg: "Property List Found", data: objProperty });

    } else {
        res.json({ result: "failure", msg: "Property List Not Found", data: objProperty });

    }
});

router.post('/updateuserPassword', async (req, res) => {
    const objUser = await User.findOne({ _id: req.body.id, isActive: true });

    if (objUser != null && verifyPassword(req.body.oldPassword, objUser.userPassword)) {
        const updated = await User.updateOne({ _id: req.body.id }, {
            userPassword: hashPassword(req.body.userPassword),
        });
        if (updated != null) {
            res.json({ result: "success", msg: "User password updated Successfully", data: 1 });
        } else {
            res.json({ result: "failure", msg: "UnSuccessful", data: 0 });
        }
    } else {
        res.json({ result: "failure", msg: "old password doesn't match", data: 0 })
    }
    // res.send(objStudent);

});


module.exports = router;
