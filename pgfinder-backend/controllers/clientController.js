
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
var AdminMessage = require("../models/adminMessage");
const { hashPassword, isHashedPassword, verifyPassword } = require('../utils/security');
const messageSecret = crypto.createHash('sha256').update(process.env.MESSAGE_SECRET || process.env.SESSION_SECRET || 'stayji-local-message-secret').digest()

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

const parseRoomInventory = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.map((item) => ({
        sharingType: item.sharingType || '',
        totalRooms: Number(item.totalRooms) || 0,
        vacantRooms: Number(item.vacantRooms) || 0,
        bedsPerRoom: Number(item.bedsPerRoom) || 1,
        vacantBeds: Number(item.vacantBeds) || 0,
        monthlyRent: item.monthlyRent || '',
    })).filter((item) => item.sharingType)
    try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parseRoomInventory(parsed)
    } catch (error) {
        return []
    }
    return []
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

const accountTypeVariants = (value) => {
    const normalized = normalizeAccountType(value)
    if (normalized === 'vendor') return ['Owner', 'Vendor', 'owner', 'vendor']
    if (normalized === 'user') return ['User', 'Personal', 'Student', 'user', 'personal', 'student']
    if (normalized === 'admin') return ['Admin', 'admin']
    return [value]
}

const encryptMessage = (text = '') => {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', messageSecret, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

const decryptMessage = (value = '') => {
    try {
        const [ivValue, tagValue, encryptedValue] = value.split(':')
        if (!ivValue || !tagValue || !encryptedValue) return value
        const decipher = crypto.createDecipheriv('aes-256-gcm', messageSecret, Buffer.from(ivValue, 'base64'))
        decipher.setAuthTag(Buffer.from(tagValue, 'base64'))
        return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64')), decipher.final()]).toString('utf8')
    } catch (error) {
        return ''
    }
}

const propertyPopulate = () => [
    { path: 'userIDFK', select: ['userFname', 'userLname', 'userType', 'userEmail', 'contact', 'verificationStatus'] },
    { path: 'vendorId', select: ['userFname', 'userLname', 'userType', 'userEmail', 'contact', 'verificationStatus'] },
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
    if (source.userIDFK || source.vendorId) filters.$or = [
        { userIDFK: source.userIDFK || source.vendorId },
        { vendorId: source.vendorId || source.userIDFK },
    ]

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
    const roleVariants = accountTypeVariants(req.body.userType || 'User')
    const existingUser = await User.findOne({
        userEmail: new RegExp(`^${req.body.userEmail}$`, 'i'),
        userType: { $in: roleVariants },
    });

    if (existingUser) {
        return res.json({
            result: "failure",
            msg: "An account already exists with this email for the selected account type.",
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
            return res.json({ result: "fail", msg: "Account type mismatch. Select the correct account type to continue.", data: null });
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
    const property = await Property.findOne({ _id: req.body.propertyIDFK }).select('userIDFK vendorId')
    var objInquiry = new Inquiry({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK });
    objInquiry.propertyIDFK = req.body.propertyIDFK,
        objInquiry.propertyId = req.body.propertyIDFK,
        objInquiry.vendorId = property?.vendorId || property?.userIDFK,
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
    const property = await Property.findOne({ _id: req.body.propertyIDFK }).select('userIDFK vendorId')
    const objInquiry = new Inquiry({
        propertyIDFK: req.body.propertyIDFK,
        propertyId: req.body.propertyIDFK,
        vendorId: property?.vendorId || property?.userIDFK,
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
    const property = await Property.findOne({ _id: req.body.propertyIDFK }).select('userIDFK vendorId')
    var objVisit = new Visit({ userIDFK: req.body.userIDFK, propertyIDFK: req.body.propertyIDFK });
    objVisit.visitDate = req.body.visitDate,
        objVisit.visitTime = req.body.visitTime || "-",
        objVisit.moveInPreference = req.body.moveInPreference || "",
        objVisit.leadStage = "qualified",
        objVisit.isConverted = false,
        objVisit.userIDFK = req.body.userIDFK,
        objVisit.userId = req.body.userIDFK,
        objVisit.propertyIDFK = req.body.propertyIDFK,
        objVisit.propertyId = req.body.propertyIDFK,
        objVisit.vendorId = property?.vendorId || property?.userIDFK,
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
    var objProperty = new Property({ userIDFK: req.body.userIDFK, vendorId: req.body.vendorId || req.body.userIDFK });
    objProperty.userIDFK = req.body.userIDFK,
        objProperty.vendorId = req.body.vendorId || req.body.userIDFK,
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
        objProperty.roomInventory = parseRoomInventory(req.body.roomInventory),
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
        objProperty.isActive = false,
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
    if (req.body.roomInventory !== undefined) updateFields.roomInventory = parseRoomInventory(req.body.roomInventory)
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
    if (req.body.verificationChecklist !== undefined) {
        try {
            updateFields.verificationChecklist = typeof req.body.verificationChecklist === 'string' ? JSON.parse(req.body.verificationChecklist) : req.body.verificationChecklist
        } catch (error) {
            updateFields.verificationChecklist = {}
        }
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

// Admin/Vendor synchronized full-profile endpoints

const selectUserSafe = (u = {}) => ({
    _id: u._id,
    userFname: u.userFname,
    userLname: u.userLname,
    userName: u.userName,
    userEmail: u.userEmail,
    contact: u.contact,
    userType: u.userType,
    profile: u.profile,
})

const toObjectIdIfValid = (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null
    return new mongoose.Types.ObjectId(id)
}

const pageOptions = (source = {}) => {
    const page = Math.max(1, Number(source.page || 1))
    const limit = Math.min(100, Math.max(1, Number(source.limit || 20)))
    return { page, limit, skip: (page - 1) * limit }
}

const vendorName = (user = {}) => [user.userFname, user.userLname].filter(Boolean).join(' ') || user.userName || user.userEmail || ''

const safeUserDto = (user = {}) => ({
    id: user._id,
    _id: user._id,
    name: vendorName(user),
    email: user.userEmail,
    phone: user.contact,
    contact: user.contact,
    role: user.userType,
    userType: user.userType,
    profile: user.profile,
    isActive: user.isActive !== false,
    verificationStatus: user.verificationStatus || (user.isActive === false ? 'Inactive' : 'Verified'),
    addedOn: user.addedOn,
})

const propertyDto = (property = {}, analytics = {}) => {
    const owner = property.vendorId || property.userIDFK || {}
    const rooms = Number(property.availableBeds) || 0
    return {
        ...(property.toObject?.() || property),
        id: property._id,
        vendorId: owner?._id || property.vendorId || property.userIDFK,
        owner: safeUserDto(owner),
        vendor: safeUserDto(owner),
        name: property.propertyName,
        city: property.cityName,
        area: property.areaName,
        category: property.propertyCategory,
        occupancy: rooms > 0 ? Math.max(0, Math.min(100, Math.round(((10 - rooms) / 10) * 100))) : (property.isAvailable === false ? 100 : 0),
        roomInventory: property.roomInventory || [],
        verificationChecklist: property.verificationChecklist || {},
        leadsCount: analytics.leadsCount || 0,
        totalLeads: analytics.leadsCount || 0,
        totalVisits: analytics.visitCount || 0,
        inquiryCount: analytics.inquiryCount || 0,
        wishlistCount: analytics.wishlistCount || 0,
        reviewsCount: analytics.reviewsCount || 0,
        complaintsCount: analytics.complaintsCount || 0,
        isActive: property.isActive !== false,
    }
}

const buildAdminPropertyQuery = (query = {}) => {
    const filters = {}
    if (query.status === 'inactive' || query.active === 'false') filters.isActive = false
    else if (query.status === 'active' || query.active === 'true') filters.isActive = true
    if (query.approvalStatus && query.approvalStatus !== 'all') filters.approvalStatus = query.approvalStatus
    if (query.city) filters.cityName = new RegExp(query.city, 'i')
    if (query.area) filters.areaName = new RegExp(query.area, 'i')
    if (query.propertyType && query.propertyType !== 'all') filters.propertyCategory = new RegExp(`^${query.propertyType}$`, 'i')
    if (query.vendorId && mongoose.Types.ObjectId.isValid(query.vendorId)) {
        const vendorObjId = new mongoose.Types.ObjectId(query.vendorId)
        filters.$or = [{ userIDFK: vendorObjId }, { vendorId: vendorObjId }]
    }
    if (query.rating) filters.rating = { $gte: Number(query.rating) || 0 }
    if (query.occupancy === 'vacant') filters.$or = [...(filters.$or || []), { isAvailable: true }, { availableBeds: { $gt: 0 } }]
    if (query.occupancy === 'full') filters.isAvailable = false

    const search = (query.q || query.search || '').trim()
    if (search) {
        const regex = new RegExp(search, 'i')
        const propertySearch = [
            ...(mongoose.Types.ObjectId.isValid(search) ? [{ _id: new mongoose.Types.ObjectId(search) }] : []),
            { propertyName: regex },
            { description: regex },
            { address: regex },
            { cityName: regex },
            { areaName: regex },
            { propertyCategory: regex },
        ]
        filters.$and = [...(filters.$and || []), { $or: [...(filters.$or || []), ...propertySearch] }]
        delete filters.$or
    }
    return filters
}

const propertyAnalyticsMap = async (propertyIds = []) => {
    const [visits, inquiries, shortlists, reviews, complaints] = await Promise.all([
        Visit.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 }, converted: { $sum: { $cond: ['$isConverted', 1, 0] } } } }]),
        Inquiry.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 }, converted: { $sum: { $cond: ['$isConverted', 1, 0] } } } }]),
        Shortlisted.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 } } }]),
        UserReview.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 }, avgRating: { $avg: { $toDouble: '$rating' } } } }]),
        UserRequest.aggregate([{ $match: { isActive: true, propertyIDFK: { $in: propertyIds } } }, { $group: { _id: '$propertyIDFK', count: { $sum: 1 } } }]),
    ])
    const map = new Map()
    const ensure = (id) => {
        const key = id?.toString()
        if (!map.has(key)) map.set(key, { visitCount: 0, inquiryCount: 0, leadsCount: 0, wishlistCount: 0, reviewsCount: 0, complaintsCount: 0, converted: 0 })
        return map.get(key)
    }
    visits.forEach((item) => { const row = ensure(item._id); row.visitCount = item.count; row.converted += item.converted; row.leadsCount += item.count })
    inquiries.forEach((item) => { const row = ensure(item._id); row.inquiryCount = item.count; row.converted += item.converted; row.leadsCount += item.count })
    shortlists.forEach((item) => { ensure(item._id).wishlistCount = item.count })
    reviews.forEach((item) => { const row = ensure(item._id); row.reviewsCount = item.count; row.avgRating = item.avgRating })
    complaints.forEach((item) => { ensure(item._id).complaintsCount = item.count })
    return map
}

// POST /client/admin/searchProperty
// Input: { q, limit?: number }
// Output: { result, data: { properties: [ { property, owner, leads:{visits:[], inquiries:[]} } ] } }
router.post('/admin/searchProperty', async (req, res) => {
    const q = (req.body?.q || req.body?.search || '').toString().trim()
    const limit = Math.max(1, Number(req.body?.limit || 10))

    if (!q) {
        return res.json({ result: 'failure', msg: 'Search query q is required', data: { properties: [] } })
    }

    try {
        const regex = new RegExp(q, 'i')

        const propertyMatches = await Property.find({
            ...publicPropertyQuery,
            isActive: true,
            $or: [
                { propertyName: regex },
                { description: regex },
                { address: regex },
                { cityName: regex },
                { areaName: regex },
                { propertyCategory: regex },
                { aminityFeatures: regex },
            ],
        })
            .limit(limit)
            .select('_id userIDFK vendorId propertyName description address rent sharing genderType areaName cityName propertyTypeIDFK aminityFeatures propertyImage propertyImageUrls videoUrl propertyCategory approvalStatus isActive isAvailable roomInventory verificationChecklist')

        const properties = propertyMatches || []
        const propertyIds = properties.map((p) => p._id)

        const owners = await User.find({ _id: { $in: properties.map((p) => p.userIDFK) } }).select('_id userFname userLname userName userEmail userType contact profile')
        const ownerMap = new Map(owners.map((o) => [o._id.toString(), o]))

        const visits = await Visit.find({
            isActive: true,
            propertyIDFK: { $in: propertyIds },
        }).select('_id visitDate visitTime moveInPreference leadStage isConverted status userIDFK propertyIDFK addedOn')

        const inquiries = await Inquiry.find({
            isActive: true,
            propertyIDFK: { $in: propertyIds },
        }).select('_id subject description preferredVisitTime moveInPreference leadStage isConverted status userIDFK propertyIDFK reply addedOn')

        const leadUserIds = Array.from(new Set([...visits.map((v) => v.userIDFK), ...inquiries.map((i) => i.userIDFK)].filter(Boolean)))
        const leadUsers = leadUserIds.length
            ? await User.find({ _id: { $in: leadUserIds } }).select('_id userFname userLname userName userEmail userType contact profile')
            : []
        const leadUserMap = new Map(leadUsers.map((u) => [u._id.toString(), u]))

        const visitsByProperty = new Map()
        visits.forEach((v) => {
            const key = v.propertyIDFK.toString()
            if (!visitsByProperty.has(key)) visitsByProperty.set(key, [])
            visitsByProperty.get(key).push({
                _id: v._id,
                visitDate: v.visitDate,
                visitTime: v.visitTime,
                moveInPreference: v.moveInPreference,
                leadStage: v.leadStage,
                isConverted: v.isConverted,
                status: v.status,
                addedOn: v.addedOn,
                user: selectUserSafe(leadUserMap.get(v.userIDFK.toString())) ,
            })
        })

        const inquiriesByProperty = new Map()
        inquiries.forEach((i) => {
            const key = i.propertyIDFK.toString()
            if (!inquiriesByProperty.has(key)) inquiriesByProperty.set(key, [])
            inquiriesByProperty.get(key).push({
                _id: i._id,
                subject: i.subject,
                description: i.description,
                preferredVisitTime: i.preferredVisitTime,
                moveInPreference: i.moveInPreference,
                leadStage: i.leadStage,
                isConverted: i.isConverted,
                status: i.status,
                reply: i.reply,
                addedOn: i.addedOn,
                user: selectUserSafe(leadUserMap.get(i.userIDFK.toString())),
            })
        })

        const data = {
            properties: properties.map((p) => {
                const owner = ownerMap.get(p.userIDFK.toString())
                return {
                    property: p,
                    owner: selectUserSafe(owner),
                    leads: {
                        visits: visitsByProperty.get(p._id.toString()) || [],
                        inquiries: inquiriesByProperty.get(p._id.toString()) || [],
                    },
                }
            }),
        }

        return res.json({ result: 'success', msg: 'Properties found', data })
    } catch (e) {
        return res.json({ result: 'failure', msg: e?.message || 'Search failed', data: { properties: [] } })
    }
})

// POST /client/admin/getVendorFullProfile
// Input: { vendorId }
router.post('/admin/getVendorFullProfile', async (req, res) => {
    const vendorId = req.body?.vendorId || req.body?.id
    const vendorObjId = toObjectIdIfValid(vendorId)
    if (!vendorObjId) {
        return res.json({ result: 'failure', msg: 'vendorId is required', data: null })
    }

    try {
        const vendor = await User.findOne({ _id: vendorObjId, userType: { $in: ['Vendor', 'vendor', 'Owner', 'owner'] } }).select('_id userFname userLname userName userEmail userType contact profile verificationStatus isActive addedOn')
        if (!vendor) {
            return res.json({ result: 'failure', msg: 'Vendor not found', data: null })
        }

        const properties = await Property.find({ $or: [{ userIDFK: vendorObjId }, { vendorId: vendorObjId }] }).select('_id userIDFK vendorId propertyName description address rent sharing genderType areaName cityName propertyTypeIDFK propertyImage propertyImageUrls videoUrl propertyCategory approvalStatus isAvailable isActive roomInventory verificationChecklist rating vacancyStatus')
        const propertyIds = properties.map((p) => p._id)

        const [visits, inquiries] = await Promise.all([
            Visit.find({ isActive: true, propertyIDFK: { $in: propertyIds } }).select('_id visitDate visitTime moveInPreference leadStage isConverted status userIDFK propertyIDFK addedOn'),
            Inquiry.find({ isActive: true, propertyIDFK: { $in: propertyIds } }).select('_id subject description preferredVisitTime moveInPreference leadStage isConverted status userIDFK propertyIDFK reply addedOn'),
        ])


        // collect users for visits/inquiries
        const leadUserIds = Array.from(new Set([...visits.map((v) => v.userIDFK), ...inquiries.map((i) => i.userIDFK)].filter(Boolean)))
        const leadUsers = leadUserIds.length
            ? await User.find({ _id: { $in: leadUserIds } }).select('_id userFname userLname userName userEmail userType contact profile')
            : []
        const leadUserMap = new Map(leadUsers.map((u) => [u._id.toString(), u]))

        const visitsByProperty = new Map()
        visits.forEach((v) => {
            const key = v.propertyIDFK.toString()
            if (!visitsByProperty.has(key)) visitsByProperty.set(key, [])
            visitsByProperty.get(key).push({
                _id: v._id,
                visitDate: v.visitDate,
                visitTime: v.visitTime,
                moveInPreference: v.moveInPreference,
                leadStage: v.leadStage,
                isConverted: v.isConverted,
                status: v.status,
                addedOn: v.addedOn,
                user: selectUserSafe(leadUserMap.get(v.userIDFK.toString())),
            })
        })

        const inquiriesByProperty = new Map()
        inquiries.forEach((i) => {
            const key = i.propertyIDFK.toString()
            if (!inquiriesByProperty.has(key)) inquiriesByProperty.set(key, [])
            inquiriesByProperty.get(key).push({
                _id: i._id,
                subject: i.subject,
                description: i.description,
                preferredVisitTime: i.preferredVisitTime,
                moveInPreference: i.moveInPreference,
                leadStage: i.leadStage,
                isConverted: i.isConverted,
                status: i.status,
                reply: i.reply,
                addedOn: i.addedOn,
                user: selectUserSafe(leadUserMap.get(i.userIDFK.toString())),
            })
        })

        const propertiesWithLeads = properties.map((p) => ({
            property: p,
            leads: {
                visits: visitsByProperty.get(p._id.toString()) || [],
                inquiries: inquiriesByProperty.get(p._id.toString()) || [],
            },
        }))

        return res.json({ result: 'success', msg: 'Vendor full profile found', data: { vendor: selectUserSafe(vendor), properties: propertiesWithLeads } })
    } catch (e) {
        return res.json({ result: 'failure', msg: e?.message || 'Vendor profile failed', data: null })
    }
})

// POST /client/vendor/getVendorFullProfile
router.post('/vendor/getVendorFullProfile', async (req, res) => {
    const vendorId = req.body?.vendorId || req.body?.id
    return router._router.handle({
        ...req,
        url: '/admin/getVendorFullProfile',
        originalUrl: '/admin/getVendorFullProfile',
        body: { ...req.body, vendorId },
    }, res, () => {})
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

    const users = await User.find(filters).select('-userPassword -resetOtp -resetOtpExpiresAt').sort({ addedOn: -1 })
    res.json({ result: "success", msg: "Admin users found", data: users })
})

router.post('/updateUserStatus', async (req, res) => {
    const updateFields = {}
    if (req.body.isActive !== undefined) updateFields.isActive = req.body.isActive === true || req.body.isActive === 'true'
    if (req.body.verificationStatus !== undefined) updateFields.verificationStatus = req.body.verificationStatus
    if (!Object.keys(updateFields).length) return res.json({ result: "failure", msg: "No user status update supplied", data: null })

    const updated = await User.updateOne({ _id: req.body.id }, { $set: updateFields })
    if (updated.modifiedCount > 0) {
        const user = await User.findOne({ _id: req.body.id }).select('-userPassword')
        res.json({ result: "success", msg: "User updated", data: user })
    } else {
        res.json({ result: "failure", msg: "User was not updated", data: 0 })
    }
})

router.post('/users/:id', async (req, res) => {
    const updateFields = {}
    if (req.body.userFname !== undefined) updateFields.userFname = req.body.userFname
    if (req.body.userLname !== undefined) updateFields.userLname = req.body.userLname
    if (req.body.userEmail !== undefined) updateFields.userEmail = req.body.userEmail
    if (req.body.contact !== undefined) updateFields.contact = req.body.contact
    if (req.body.gender !== undefined) updateFields.gender = req.body.gender
    if (req.body.occupation !== undefined) updateFields.occupation = req.body.occupation
    if (req.body.verificationStatus !== undefined) updateFields.verificationStatus = req.body.verificationStatus

    if (req.body.userEmail !== undefined) {
        const existing = await User.findOne({
            _id: { $ne: req.params.id },
            userEmail: new RegExp(`^${req.body.userEmail}$`, 'i'),
            userType: { $in: accountTypeVariants(req.body.userType || req.body.role || 'User') },
        })
        if (existing) return res.json({ result: 'failure', msg: 'Email already exists for this account type.', data: null })
    }

    const user = await User.findOneAndUpdate({ _id: req.params.id }, { $set: updateFields }, { new: true }).select('-userPassword')
    res.json({ result: user ? 'success' : 'failure', msg: user ? 'User updated' : 'User not found', data: user })
})

router.post('/requestPasswordReset', async (req, res) => {
    const email = (req.body.userEmail || req.body.email || '').trim()
    const user = await User.findOne({ userEmail: new RegExp(`^${email}$`, 'i'), isActive: true })
    if (user) {
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`
        await User.updateOne({ _id: user._id }, { resetOtp: hashPassword(otp), resetOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) })
        console.log(`StayJi password reset OTP for ${email}: ${otp}`)
    }
    res.json({ result: 'success', msg: 'If this email exists, a verification code has been sent.', data: 1 })
})

router.post('/resetPasswordWithOtp', async (req, res) => {
    const email = (req.body.userEmail || req.body.email || '').trim()
    const user = await User.findOne({ userEmail: new RegExp(`^${email}$`, 'i'), isActive: true })
    if (!user || !user.resetOtp || !user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date() || !verifyPassword(req.body.otp || '', user.resetOtp)) {
        return res.json({ result: 'failure', msg: 'Invalid or expired verification code.', data: 0 })
    }
    await User.updateOne({ _id: user._id }, { userPassword: hashPassword(req.body.userPassword || req.body.password), resetOtp: '', resetOtpExpiresAt: null })
    res.json({ result: 'success', msg: 'Password reset successfully.', data: 1 })
})

router.get('/analytics', async (req, res) => {
    try {
        const [
            users,
            activeUsers,
            vendors,
            activeListings,
            inactiveListings,
            pendingProperties,
            visitLeads,
            inquiryLeads,
            convertedVisits,
            convertedInquiries,
            revenue,
            cityHeatmap,
            topProperties,
            trendRows,
        ] = await Promise.all([
            User.countDocuments({ userType: { $ne: 'Admin' } }),
            User.countDocuments({ isActive: true, userType: { $ne: 'Admin' } }),
            User.countDocuments({ isActive: true, userType: { $in: ['Vendor', 'Owner', 'vendor', 'owner'] } }),
            Property.countDocuments({ isActive: true, approvalStatus: 'Approved' }),
            Property.countDocuments({ isActive: false }),
            Property.countDocuments({ approvalStatus: 'Pending' }),
            Visit.countDocuments({ isActive: true }),
            Inquiry.countDocuments({ isActive: true }),
            Visit.countDocuments({ isActive: true, isConverted: true }),
            Inquiry.countDocuments({ isActive: true, isConverted: true }),
            Payment.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }]),
            Property.aggregate([{ $match: { isActive: true, approvalStatus: 'Approved' } }, { $group: { _id: '$cityName', listings: { $sum: 1 }, vacancies: { $sum: { $cond: ['$isAvailable', 1, 0] } } } }, { $sort: { listings: -1 } }, { $limit: 12 }]),
            Inquiry.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$propertyIDFK', inquiries: { $sum: 1 } } },
                { $sort: { inquiries: -1 } },
                { $limit: 8 },
                { $lookup: { from: 'propertymasters', localField: '_id', foreignField: '_id', as: 'property' } },
                { $unwind: '$property' },
                { $match: { 'property.isActive': true, 'property.approvalStatus': 'Approved' } },
                { $project: { propertyId: '$_id', name: '$property.propertyName', city: '$property.cityName', inquiries: 1 } },
            ]),
            Inquiry.find({ isActive: true }).select('addedOn isConverted').lean(),
        ])
        const leads = visitLeads + inquiryLeads
        const conversions = convertedVisits + convertedInquiries
        const liveVacancies = cityHeatmap.reduce((sum, row) => sum + (row.vacancies || 0), 0)
        const occupancyRate = activeListings ? Math.round(((activeListings - liveVacancies) / activeListings) * 100) : 0
        const trendMap = new Map()
        trendRows.forEach((lead) => {
            const date = new Date(lead.addedOn)
            const key = Number.isNaN(date.getTime()) ? 'Unknown' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            if (!trendMap.has(key)) trendMap.set(key, { month: key, leads: 0, conversions: 0 })
            const row = trendMap.get(key)
            row.leads += 1
            if (lead.isConverted) row.conversions += 1
        })
        res.json({
            result: 'success',
            msg: 'Admin analytics found',
            data: {
                summary: {
                    totalUsers: users,
                    activeUsers,
                    vendors,
                    activeListings,
                    inactiveListings,
                    liveVacancies,
                    pendingProperties,
                    occupancyRate,
                    leads,
                    conversionRate: leads ? Math.round((conversions / leads) * 100) : 0,
                    conversions,
                    revenue: revenue[0]?.total || 0,
                },
                trends: Array.from(trendMap.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12),
                cityHeatmap: cityHeatmap.map((row) => ({ city: row._id || 'Unknown', listings: row.listings, vacancies: row.vacancies })),
                topProperties,
            },
        })
    } catch (error) {
        res.json({ result: 'failure', msg: error?.message || 'Analytics failed', data: null })
    }
})

router.get('/properties', async (req, res) => {
    try {
        const { page, limit, skip } = pageOptions(req.query)
        const filters = buildAdminPropertyQuery(req.query)
        const search = (req.query.q || req.query.search || '').trim()
        if (search) {
            const regex = new RegExp(search, 'i')
            const vendorIds = await User.find({ $or: [{ userFname: regex }, { userLname: regex }, { userEmail: regex }, { contact: regex }] }).distinct('_id')
            const vendorConditions = [{ userIDFK: { $in: vendorIds } }, { vendorId: { $in: vendorIds } }]
            if (filters.$and?.[0]?.$or) filters.$and[0].$or.push(...vendorConditions)
        }
        const sortMap = {
            newest: { addedOn: -1 },
            oldest: { addedOn: 1 },
            'rent-low': { rent: 1 },
            'rent-high': { rent: -1 },
            rating: { rating: -1 },
        }
        const [total, rows] = await Promise.all([
            Property.countDocuments(filters),
            Property.find(filters).populate(propertyPopulate()).sort(sortMap[req.query.sort] || sortMap.newest).skip(skip).limit(limit),
        ])
        const analytics = await propertyAnalyticsMap(rows.map((row) => row._id))
        res.json({
            result: 'success',
            msg: 'Admin properties found',
            data: {
                items: rows.map((row) => propertyDto(row, analytics.get(row._id.toString()) || {})),
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        res.json({ result: 'failure', msg: error?.message || 'Admin properties failed', data: { items: [], total: 0 } })
    }
})

router.get('/properties/:id', async (req, res) => {
    try {
        const property = await Property.findOne({ _id: req.params.id }).populate(propertyPopulate())
        if (!property) return res.json({ result: 'failure', msg: 'Property not found', data: null })
        const propertyIds = [property._id]
        const analytics = await propertyAnalyticsMap(propertyIds)
        const [visits, inquiries, reviews, complaints, shortlists, images] = await Promise.all([
            Visit.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).sort({ addedOn: -1 }),
            Inquiry.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).sort({ addedOn: -1 }),
            UserReview.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail']).sort({ addedOn: -1 }),
            UserRequest.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).sort({ addedOn: -1 }),
            Shortlisted.find({ isActive: true, propertyIDFK: property._id }).populate('userIDFK', ['userFname', 'userLname', 'userEmail']).sort({ addedOn: -1 }),
            PropertyImage.find({ isActive: true, propertyIDFK: property._id }).sort({ addedOn: -1 }),
        ])
        res.json({
            result: 'success',
            msg: 'Admin property detail found',
            data: {
                property: propertyDto(property, analytics.get(property._id.toString()) || {}),
                leads: { visits, inquiries },
                reviews,
                complaints,
                shortlists,
                images,
            },
        })
    } catch (error) {
        res.json({ result: 'failure', msg: error?.message || 'Property detail failed', data: null })
    }
})

router.post('/properties/:id/status', async (req, res) => {
    const update = {}
    if (req.body.approvalStatus) update.approvalStatus = req.body.approvalStatus
    if (req.body.isActive !== undefined) update.isActive = req.body.isActive === true || req.body.isActive === 'true'
    if (req.body.isAvailable !== undefined) update.isAvailable = req.body.isAvailable === true || req.body.isAvailable === 'true'
    if (!Object.keys(update).length) return res.json({ result: 'failure', msg: 'No status update supplied', data: null })
    const updated = await Property.findOneAndUpdate({ _id: req.params.id }, { $set: update }, { new: true }).populate(propertyPopulate())
    res.json({ result: updated ? 'success' : 'failure', msg: updated ? 'Property updated' : 'Property not found', data: updated ? propertyDto(updated) : null })
})

router.post('/properties/bulk', async (req, res) => {
    const ids = (req.body.ids || []).filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id))
    const update = {}
    if (req.body.action === 'approve') update.approvalStatus = 'Approved'
    if (req.body.action === 'reject') update.approvalStatus = 'Rejected'
    if (req.body.action === 'deactivate') update.isActive = false
    if (req.body.action === 'activate') update.isActive = true
    if (req.body.approvalStatus) update.approvalStatus = req.body.approvalStatus
    if (req.body.isActive !== undefined) update.isActive = req.body.isActive === true || req.body.isActive === 'true'
    if (!ids.length || !Object.keys(update).length) return res.json({ result: 'failure', msg: 'No properties selected', data: { modifiedCount: 0 } })
    const result = await Property.updateMany({ _id: { $in: ids } }, { $set: update })
    res.json({ result: 'success', msg: 'Bulk property update complete', data: { modifiedCount: result.modifiedCount || 0 } })
})

router.get('/vendors', async (req, res) => {
    const { page, limit, skip } = pageOptions(req.query)
    const filters = { userType: { $in: ['Vendor', 'Owner', 'vendor', 'owner'] } }
    if (req.query.status === 'inactive') filters.isActive = false
    else if (req.query.status !== 'all') filters.isActive = true
    const search = (req.query.q || req.query.search || '').trim()
    if (search) {
        const regex = new RegExp(search, 'i')
        filters.$or = [{ userFname: regex }, { userLname: regex }, { userEmail: regex }, { contact: regex }]
    }
    const [total, vendors] = await Promise.all([
        User.countDocuments(filters),
        User.find(filters).select('-userPassword').sort({ addedOn: -1 }).skip(skip).limit(limit),
    ])
    const vendorIds = vendors.map((vendor) => vendor._id)
    const propertyCounts = await Property.aggregate([{ $match: { $or: [{ userIDFK: { $in: vendorIds } }, { vendorId: { $in: vendorIds } }] } }, { $group: { _id: '$userIDFK', totalProperties: { $sum: 1 }, activeProperties: { $sum: { $cond: ['$isActive', 1, 0] } } } }])
    const countMap = new Map(propertyCounts.map((item) => [item._id?.toString(), item]))
    res.json({ result: 'success', msg: 'Admin vendors found', data: { items: vendors.map((vendor) => ({ ...safeUserDto(vendor), ...(countMap.get(vendor._id.toString()) || { totalProperties: 0, activeProperties: 0 }) })), page, limit, total, pages: Math.ceil(total / limit) } })
})

router.get('/vendors/:id', async (req, res) => {
    req.body = { vendorId: req.params.id }
    return router.handle({ ...req, method: 'POST', url: '/admin/getVendorFullProfile' }, res)
})

router.get('/users', async (req, res) => {
    req.query = { ...req.query }
    return router.handle({ ...req, url: '/getAdminUsers' }, res)
})

router.post('/users/:id/status', async (req, res) => {
    req.body = { ...req.body, id: req.params.id }
    return router.handle({ ...req, url: '/updateUserStatus' }, res)
})

router.get('/leads', async (req, res) => {
    const { page, limit, skip } = pageOptions(req.query)
    const match = { isActive: true }
    if (req.query.propertyId && mongoose.Types.ObjectId.isValid(req.query.propertyId)) match.propertyIDFK = new mongoose.Types.ObjectId(req.query.propertyId)
    const [visits, inquiries] = await Promise.all([
        Visit.find(match).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).populate({ path: 'propertyIDFK', populate: { path: 'userIDFK', select: ['userFname', 'userLname', 'userEmail', 'contact'] } }).sort({ addedOn: -1 }).skip(skip).limit(limit),
        Inquiry.find(match).populate('userIDFK', ['userFname', 'userLname', 'userEmail', 'contact']).populate({ path: 'propertyIDFK', populate: { path: 'userIDFK', select: ['userFname', 'userLname', 'userEmail', 'contact'] } }).sort({ addedOn: -1 }).skip(skip).limit(limit),
    ])
    const items = [
        ...visits.map((lead) => ({ id: lead._id, type: 'visit', user: safeUserDto(lead.userIDFK), property: propertyDto(lead.propertyIDFK || {}), addedOn: lead.addedOn, isConverted: lead.isConverted, status: lead.status })),
        ...inquiries.map((lead) => ({ id: lead._id, type: 'inquiry', user: safeUserDto(lead.userIDFK), property: propertyDto(lead.propertyIDFK || {}), subject: lead.subject, addedOn: lead.addedOn, isConverted: lead.isConverted, status: lead.status })),
    ].sort((a, b) => new Date(b.addedOn || 0) - new Date(a.addedOn || 0)).slice(0, limit)
    res.json({ result: 'success', msg: 'Admin leads found', data: { items, page, limit, total: items.length } })
})

router.get('/vendors/:id/messages', async (req, res) => {
    const viewer = req.query.viewer === 'vendor' ? 'vendor' : 'admin'
    const deleteFilter = viewer === 'vendor' ? { deletedForVendor: { $ne: true } } : { deletedForAdmin: { $ne: true } }
    const messages = await AdminMessage.find({ vendorId: req.params.id, isActive: true, ...deleteFilter })
        .populate('adminId', ['userFname', 'userLname', 'userEmail'])
        .populate('vendorId', ['userFname', 'userLname', 'userEmail'])
        .populate('propertyId', ['propertyName'])
        .sort({ addedOn: 1 })
    res.json({ result: 'success', msg: 'Vendor messages found', data: messages.map((item) => ({ ...item.toObject(), message: decryptMessage(item.message) })) })
})

router.post('/vendors/:id/messages', async (req, res) => {
    if (!req.body.message || !req.body.message.trim()) {
        return res.json({ result: 'failure', msg: 'Message is required.', data: null })
    }
    const message = await AdminMessage.create({
        vendorId: req.params.id,
        adminId: req.body.adminId,
        propertyId: req.body.propertyId || null,
        senderRole: req.body.senderRole || 'admin',
        message: encryptMessage(req.body.message.trim()),
    })
    res.json({ result: 'success', msg: 'Message sent.', data: { ...message.toObject(), message: req.body.message.trim() } })
})

router.post('/vendors/:id/messages/:messageId/delete', async (req, res) => {
    const scope = req.body.scope || 'self'
    const viewer = req.body.viewer === 'vendor' ? 'vendor' : 'admin'
    const update = {}
    if (scope === 'both') update.isActive = false
    else if (viewer === 'vendor') update.deletedForVendor = true
    else update.deletedForAdmin = true
    const message = await AdminMessage.findOneAndUpdate({ _id: req.params.messageId, vendorId: req.params.id }, { $set: update }, { new: true })
    res.json({ result: message ? 'success' : 'failure', msg: message ? 'Message deleted.' : 'Message not found.', data: message })
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
