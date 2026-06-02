
var express = require('express');
var router = express.Router();
var multer = require('multer');

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
const { body } = require('express-validator');
const defaultAdmin = {
  userName: 'Admin',
  userFname: 'Admin',
  userLname: 'A',
  userEmail: 'admin@gmail.com',
  userPassword: hashPassword('123'),
  dob: '',
  gender: 'female',
  contact: '123456789',
  occupation: '',
  city: 'Bangalore',
  userType: 'Admin',
  assignedCity: 'Bangalore',
  assignedState: 'Karnataka',
  permissions: ['manage_users', 'manage_properties', 'manage_moderation', 'manage_seo', 'view_city_analytics'],
  accountStatus: 'active',
  approvalStatus: 'Approved',
  isVerified: true,
  profile: '',
  addedOn: new Date().toISOString(),
  isActive: true,
};
const defaultSuperAdmin = {
  userName: 'Super Admin',
  userFname: 'Super',
  userLname: 'Admin',
  userEmail: process.env.SUPER_ADMIN_EMAIL || 'superadmin@stayji.com',
  userPassword: hashPassword(process.env.SUPER_ADMIN_PASSWORD || 'StayJi@12345'),
  dob: '',
  gender: '',
  contact: process.env.SUPER_ADMIN_PHONE || '9999999999',
  occupation: 'Platform governance',
  userType: 'Super Admin',
  permissions: ['manage_users', 'manage_properties', 'manage_finance', 'manage_admins', 'manage_dummy_data', 'manage_seo', 'manage_moderation', 'view_global_analytics'],
  approvalStatus: 'Approved',
  accountStatus: 'active',
  isVerified: true,
  profile: '',
  addedOn: new Date().toISOString(),
  isActive: true,
};

async function ensureDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ userType: 'Admin' })
    if (!adminExists) {
      await new User(defaultAdmin).save()
      console.log('Default admin user created.')
    }
    const superAdminExists = await User.findOne({ userType: { $in: ['Super Admin', 'SuperAdmin', 'super_admin'] } })
    if (!superAdminExists) {
      await new User(defaultSuperAdmin).save()
      console.log('Default super admin user created.')
    }
  } catch (error) {
    console.error('Error ensuring default admin user:', error)
  }
}

// Ensure default admin users only after MongoDB is connected.
// This prevents startup crashes/timeouts when DATABASE is temporarily unreachable.
if (require('mongoose').connection.readyState === 1) {
  ensureDefaultAdmin();
} else {
  console.log('MongoDB not connected yet; skipping ensureDefaultAdmin() at startup');
  require('mongoose').connection.once('connected', () => {
    ensureDefaultAdmin();
  });
}

var storage = multer.diskStorage({
    destination: function (req, res, cb) {
        var docimg=req.body.docimg;
        if(docimg=="PropertyImage")
        {
            cb(null, './public/upload/PropertyImage')
        }else if(docimg=="PropertyTypeImage"){
            cb(null, './public/upload/PropertyTypeImage')
        }else if(docimg=="PropertyImages"){
            cb(null, './public/upload/PropertyImages')
        }else if(docimg=="UserImage"){
            cb(null, './public/upload/UserImage')
        }
        else{
            cb(null, './public/upload')
        }
        
    },

    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
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

router.get('/',async(req,res)=>{
    sess = req.session;
 
    if (sess.userEmail) {

    const objAreaEJS = await Area.find({
        isActive: true
    });
    const objUserEJS = await User.find({
        isActive: true
    });
    const objPropertyTypeEJS = await PropertyType.find({
        isActive: true
    });
    const objPropertyEJS = await Property.find({
        isActive: true
    });
    const objRequestEJS = await UserRequest.find({
        isActive: true
    });
    const objInquiryEJS = await Inquiry.find({
        isActive: true
    });
    const objVisitEJS = await Visit.find({
        isActive: true
    });
    const objPropertyAvailableEJS = await Property.find({
        isActive: true,
        isAvailable:true
    }).populate('userIDFK', ['userFname','userLname'])
    .populate('propertyTypeIDFK', 'typeName').limit(5)
    for (var i = 0; i < objPropertyAvailableEJS.length; i++) {
        objPropertyAvailableEJS[i].user_value = objPropertyAvailableEJS[i].userIDFK.userFname+" "+ objPropertyAvailableEJS[i].userIDFK.userLname 
        objPropertyAvailableEJS[i].propertyType_value = objPropertyAvailableEJS[i].propertyTypeIDFK.typeName
    }
    var data = [];
    data["areaCount"]= objAreaEJS.length;
    data["userCount"]= objUserEJS.length;
    data["typeCount"]= objPropertyTypeEJS.length;
    data["propertyCount"]= objPropertyEJS.length;
    data["requestCount"]= objRequestEJS.length;
    data["inquiryCount"]= objInquiryEJS.length;
    data["visitCount"]= objVisitEJS.length;
    data["availableProperty"]=objPropertyAvailableEJS;
    res.render('index',{"data":data,objUser:req.session.userType});
}else {
    res.render('login');
  }
});


router.post('/loginEJS', async (req, res) => {
  const objUser = await User.findOne({
    userEmail: req.body.userEmail,
    isActive: true,
  });

  if (!objUser || !verifyPassword(req.body.userPassword, objUser.userPassword)) {
    return res.render('login', { error: 'Invalid email or password.' });
  }

  if (!isHashedPassword(objUser.userPassword)) {
    await User.updateOne({ _id: objUser._id }, { userPassword: hashPassword(req.body.userPassword) });
  }

  if ((objUser.userType || '').toLowerCase() !== 'admin') {
    return res.render('login', { error: 'Only admin users can log in here.' });
  }

  sess = req.session;
  sess.userEmail = req.body.userEmail;
  sess.userType = objUser.userType;
  sess.userFname = objUser.userFname;
  sess.userLname = objUser.userLname;
  res.redirect('/admin');
});

  router.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/admin');
  });

router.use((req, res, next) => {
    if (req.session && req.session.userEmail && (req.session.userType || '').toLowerCase() === 'admin') {
        return next();
    }
    return res.redirect('/admin');
});

//Area

router.get('/addArea', async (req, res) => {
    res.render("addArea.html", {
        operation: "insert"
    });
});

router.post('/addAreaEJS', async (req, res) => {
    const objArea = new Area();
    objArea.areaName = req.body.areaName,
    objArea.cityName = req.body.cityName,
    objArea.addedOn = new Date(),
    objArea.isActive = true
    const inserted = await objArea.save();
    res.redirect("showArea");
});

router.get('/showArea', async (req, res) => {
    const objAreaEJS = await Area.find({
        isActive: true
    });
    res.render("showArea.html", {
        "data": objAreaEJS
    });
});

router.get('/fetchArea/:id', async (req, res) => {
    const fetchAreaObj = await Area.findOne({
        _id: req.params.id
    });

    res.render("addArea.html", {
        operation: "update",
        areaData: fetchAreaObj
    });
});

router.post('/updateAreaEJS',async (req, res) => {
    console.log(req.body.id)
        const objArea = await Area.updateOne({
            _id: req.body.id
        }, {
            areaName: req.body.areaName,
            cityName: req.body.cityName     
        });
        // res.send(objArea)
        res.redirect("showArea");
});
router.post('/deleteArea', async (req, res) => {
    console.log(req.body.id);
    const objDeleteArea = await Area.updateOne({
        _id: req.body.id
    },{
        isActive : false
    });
    res.redirect("showArea");
});

//Property Type

router.get('/addPropertyType', async (req, res) => {
    res.render("addPropertyType.html", {
        operation: "insert"
    });
});

router.post('/addPropertyTypeEJS',upload.single('image'), async (req, res) => {
    const objPropertyType = new PropertyType();
    objPropertyType.typeName = req.body.typeName,
    objPropertyType.image = req.file.filename,
    objPropertyType.addedOn = new Date(),
    objPropertyType.isActive = true
    const inserted = await objPropertyType.save();
    res.redirect("showPropertyType");
});

router.get('/showPropertyType', async (req, res) => {
    const objPropertyTypeEJS = await PropertyType.find({
        isActive: true
    });
    res.render("showPropertyType.html", {
        "data": objPropertyTypeEJS
    });
});

router.get('/fetchPropertyType/:id', async (req, res) => {
    const fetchPropertyTypeObj = await PropertyType.findOne({
        _id: req.params.id
    });

    res.render("addPropertyType.html", {
        operation: "update",
        propertyTypeData: fetchPropertyTypeObj
    });
});

router.post('/updatePropertyTypeEJS',upload.single('image'),async (req, res) => {
    console.log(req.body.id)
        if (req.file) {
            const objPropertyType = await PropertyType.updateOne({
                _id: req.body.id
            }, {
                typeName: req.body.typeName,
                image: req.file.filename  
            });
            res.redirect("showPropertyType");
        } else {
            
            const objPropertyType = await PropertyType.updateOne({
                _id: req.body.id
            }, {
                typeName: req.body.typeName,
            });
            // res.send(objTeacher)
            res.redirect("showPropertyType");
        }
});
router.post('/deletePropertyType', async (req, res) => {
    console.log(req.body.id);
    const objDeletePropertyType = await PropertyType.updateOne({
        _id: req.body.id
    },{
        isActive : false
    });
    res.redirect("showPropertyType");
});

//Property

router.get('/addProperty', async (req, res) => {

    const objUser = await User.find({isActive:true});
    const objPropertyType = await PropertyType.find({isActive:true});
    res.render("addProperty.html", {operation:"insert",userData:objUser,propertyTypeData:objPropertyType});
});

router.post('/addPropertyEJS',upload.fields([{name:'propertyImage'},{name:'image'}]), async (req, res) => {
    console.log(req.body);
    const objProperty = new Property();
    objProperty.userIDFK = req.body.userIDFK,
    objProperty.propertyName = req.body.propertyName,
    objProperty.description = req.body.description,
    objProperty.address = req.body.address,
    objProperty.rent = req.body.rent,
    objProperty.sharing = req.body.sharing,
    objProperty.genderType = req.body.genderType,
    objProperty.areaName = req.body.areaName,
    objProperty.cityName = req.body.cityName,
    objProperty.propertyTypeIDFK = req.body.propertyTypeIDFK,
    objProperty.aminityFeatures = "",
    objProperty.propertyImage = req.files["propertyImage"][0].filename,
    objProperty.isAvailable = true,
    objProperty.addedOn = new Date(),
    objProperty.isActive = true
    const inserted = await objProperty.save();

    //property 
    var images=req.files["image"];
    console.log(images)
    images.forEach(async (element)=>{
        const objPropertyImage = new PropertyImage();
        objPropertyImage.propertyIDFK = inserted._id.toString(),
        console.log("id"+req.body.propertyIDFK);
        objPropertyImage.image = element.filename,
        objPropertyImage.addedOn = new Date(),
        objPropertyImage.isActive = true
     const insertedImg = await objPropertyImage.save(); 
    });

    

    res.redirect("addAminityFeatures/"+inserted._id.toString());
});

router.get('/showProperty', async (req, res) => {

    let objProperty = await Property.find({isActive: true})
        .populate('userIDFK', ['userFname','userLname'])
        .populate('propertyTypeIDFK', 'typeName');

    for (var i = 0; i < objProperty.length; i++) {
        objProperty[i].user_value = objProperty[i].userIDFK ? `${objProperty[i].userIDFK.userFname || ''} ${objProperty[i].userIDFK.userLname || ''}`.trim() : 'Unknown owner'
        objProperty[i].propertyType_value = objProperty[i].propertyTypeIDFK ? objProperty[i].propertyTypeIDFK.typeName : (objProperty[i].propertyCategory || 'PG')
    }
    
    res.render("showProperty.html",{"data":objProperty});

});

router.get('/showInactiveProperty', async (req, res) => {
    let objProperty = await Property.find({isActive: false})
        .populate('userIDFK', ['userFname','userLname'])
        .populate('propertyTypeIDFK', 'typeName');

    for (var i = 0; i < objProperty.length; i++) {
        objProperty[i].user_value = objProperty[i].userIDFK.userFname+" "+ objProperty[i].userIDFK.userLname 
        objProperty[i].propertyType_value = objProperty[i].propertyTypeIDFK.typeName
    }

    res.render("showInactiveProperty.html",{"data":objProperty});
});

router.post('/reactivateProperty', async (req, res) => {
    const objProperty = await Property.updateOne({ _id: req.body.id }, { isActive: true });
    res.redirect("showInactiveProperty");
});

router.post('/updatePropertyStatus', async (req, res) => {
    const objProperty = await Property.updateOne({ _id: req.body.id }, { approvalStatus: req.body.status });
    res.redirect("showProperty");
});

router.get('/fetchProperty/:id', async (req, res) => {
    const fetchPropertyObj = await Property.findOne({
        _id: req.params.id
    });
    const objUser = await User.find();
    const objPropertyType = await PropertyType.find();
    console.log(objPropertyType);
    res.render("addProperty.html", {operation:"update",propertyData:fetchPropertyObj,userData:objUser,propertyTypeData:objPropertyType});
});

router.post('/updatePropertyEJS',upload.single('propertyImage'),async (req, res) => {
    console.log(req.body)
        if (req.file) {
            const objProperty = await Property.updateOne({
                _id: req.body.id
            }, {
                userIDFK : req.body.userIDFK,
                propertyName : req.body.propertyName,
                description : req.body.description,
                address : req.body.address,
                rent :req.body.rent,
                sharing :req.body.sharing,
                genderType : req.body.genderType,
                areaName :req.body.areaName,
                cityName :req.body.cityName,
                propertyTypeIDFK :req.body.propertyTypeIDFK,
                propertyImage : req.file.filename,
                isAvailable : req.body.isAvailable,
            });
            if (objProperty != null) {
                res.redirect("addAminityFeatures/"+req.body.id);
            } else {
                res.redirect("addAminityFeatures/"+req.body.id);
            }
        } else {
            
            const objProperty = await Property.updateOne({
                _id: req.body.id
            }, {
                userIDFK : req.body.userIDFK,
                propertyName : req.body.propertyName,
                description : req.body.description,
                address : req.body.address,
                rent :req.body.rent,
                sharing :req.body.sharing,
                genderType : req.body.genderType,
                areaName :req.body.areaName,
                cityName :req.body.cityName,
                propertyTypeIDFK :req.body.propertyTypeIDFK,
               // propertyImage : req.file.filename,
                isAvailable : req.body.isAvailable,
            });
            // res.send(objTeacher)
            if (objProperty != null) {
                res.redirect("addAminityFeatures/"+req.body.id);
            } else {
                res.redirect("addAminityFeatures/"+req.body.id);
            }
        }
});
router.post('/deleteProperty', async (req, res) => {
    console.log(req.body.id);
    const objDeleteProperty = await Property.updateOne({
        _id: req.body.id
    },{
        isActive : false
    });
    res.redirect("showProperty");
});


router.get('/addAminityFeatures/:id', async (req, res) => {
    console.log(req.params.id);
    var aminityFeatures="";
    const objProperty = await Property.findOne({ _id: req.params.id });
    const typeData = await Aminity.find({ propertyTypeIDFK: objProperty.propertyTypeIDFK});
    var aminityData = [];
    if(objProperty.aminityFeatures != ""){
       
       for (const iterator of objProperty.aminityFeatures.split(",")) {
        aminityData.push(iterator.split(":")[1]);
       }
    }
    
    console.log(typeData.length);

    
    console.log(aminityData);
    

    res.render('addAminityFeatures.html', { typeData: typeData, noofsize: typeData.length,aminityData:aminityData,propertyID: objProperty._id,"type":"form" });
});


router.post('/updateAminityFeature', async (req, res) => {

    console.log(req);
    const size = req.body.noOfSizes;
    var aminityFeatures="";
    for (var i = 1; i <= size; i++) {
        if(aminityFeatures == ""){
            aminityFeatures = req.body['aminityFeaturesText' + i]+":"+req.body['aminityFeaturesValue' + i];
        }else{
            aminityFeatures += ","+req.body['aminityFeaturesText' + i]+":"+req.body['aminityFeaturesValue' + i];
        }
            
    }
    console.log(aminityFeatures);
    const objProperty = await Property.updateOne({
        _id: req.body.id,
    }, 
    {
        aminityFeatures:aminityFeatures,
    });
    if (objProperty != null) {
        res.redirect("showProperty");
    } else {
        res.redirect("showProperty");
    }
});

//User

router.get('/addUser', async (req, res) => {
    res.render("addUser.html", {
        operation: "insert"
    });
});

router.post('/addUserEJS',upload.single('profile'), async (req, res) => {
    
    const objUser = new User();
    objUser.userName = req.body.userName,
    objUser.userFname = req.body.userFname,
    objUser.userLname = req.body.userLname,
    objUser.userEmail = req.body.userEmail,
    objUser.userPassword = hashPassword(req.body.userPassword),
    objUser.dob = req.body.dob,
    objUser.gender = req.body.gender,
    objUser.contact = req.body.contact,
    objUser.occupation = req.body.occupation,
    objUser.userType = req.body.userType,
    objUser.profile = req.file.filename,
    objUser.addedOn = new Date(),
    objUser.isActive = true;
    console.log();
    const inserted = await objUser.save();
    res.redirect("showUser");
});

router.get('/showUser', async (req, res) => {
    const filters = {
        isActive: req.query.status === 'inactive' ? false : true,
    };

    if (req.query.userType) {
        filters.userType = req.query.userType;
    }

    const search = req.query.search ? req.query.search.trim() : '';
    if (search) {
        const regex = new RegExp(search, 'i');
        filters.$or = [
            { userFname: regex },
            { userLname: regex },
            { userEmail: regex },
            { contact: regex },
        ];
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments(filters);
    const objUserEJS = await User.find(filters).skip(skip).limit(limit);

    const vendorIds = objUserEJS.filter((user) => user.userType === 'Vendor').map((user) => user._id);
    const propertyCounts = await Property.aggregate([
        { $match: { userIDFK: { $in: vendorIds }, isActive: true } },
        { $group: { _id: '$userIDFK', count: { $sum: 1 } } },
    ]);
    const countMap = propertyCounts.reduce((map, item) => ({ ...map, [item._id.toString()]: item.count }), {});
    const usersWithCounts = objUserEJS.map((user) => {
        const userObj = user.toObject ? user.toObject() : user;
        return { ...userObj, propertyCount: countMap[userObj._id.toString()] || 0 };
    });

    const totalPages = Math.ceil(totalUsers / limit) || 1;

    res.render('showUser.html', {
        data: usersWithCounts,
        userTypeFilter: req.query.userType || 'All',
        statusFilter: req.query.status || 'active',
        searchQuery: req.query.search || '',
        currentPage: page,
        totalPages: totalPages,
    });
});

router.get('/showVendorProperties/:id', async (req, res) => {
    const vendor = await User.findOne({ _id: req.params.id, userType: 'Vendor', isActive: true });
    if (!vendor) {
        return res.redirect('showUser');
    }

    const properties = await Property.find({ userIDFK: vendor._id, isActive: true })
        .populate('propertyTypeIDFK', 'typeName');

    for (let i = 0; i < properties.length; i += 1) {
        properties[i].propertyType_value = properties[i].propertyTypeIDFK?.typeName || 'PG';
    }

    res.render('showVendorProperties.html', {
        vendor,
        properties,
    });
});

router.get('/fetchUser/:id', async (req, res) => {
    const fetchUserObj = await User.findOne({
        _id: req.params.id
    });

    res.render("addUser.html", {
        operation: "update",
        userData: fetchUserObj
    });
});

router.post('/updateUserEJS',upload.single('profile'),async (req, res) => {
    console.log(req.body.id)
        const updateFields = {
            userName : req.body.userName,
            userFname : req.body.userFname,
            userLname : req.body.userLname,
            userEmail : req.body.userEmail,
            dob : req.body.dob,
            gender : req.body.gender,
            contact :req.body.contact,
            occupation : req.body.occupation,
            userType : req.body.userType,
        };
        if (req.body.userPassword) {
            updateFields.userPassword = hashPassword(req.body.userPassword);
        }
        if (req.file) {
            updateFields.profile = req.file.filename;
        }

        await User.updateOne({
            _id: req.body.id
        }, updateFields);
        res.redirect("showUser");
        /*
        if (req.file) {
            const objUser = await User.updateOne({
                _id: req.body.id
            }, {
                    userName : req.body.userName,
                    userFname : req.body.userFname,
                    userLname : req.body.userLname,
                    userEmail : req.body.userEmail,
                    userPassword : hashPassword(req.body.userPassword),
                    dob : req.body.dob,
                    gender : req.body.gender,
                    contact :req.body.contact,
                    occupation : req.body.occupation,
                    userType : req.body.userType,
                    profile : req.file.filename,
            });
            res.redirect("showUser");
        } else {
            
            const objPropertyType = await PropertyType.updateOne({
                _id: req.body.id
            }, {
                    userName : req.body.userName,
                    userFname : req.body.userFname,
                    userLname : req.body.userLname,
                    userEmail : req.body.userEmail,
                    userPassword : hashPassword(req.body.userPassword),
                    dob : req.body.dob,
                    gender : req.body.gender,
                    contact :req.body.contact,
                    occupation : req.body.occupation,
                    userType : req.body.userType,
                    //profile : req.file.filename,
            });
            // res.send(objTeacher)
            res.redirect("showUser");
        }
        */
});
router.post('/deleteUser', async (req, res) => {
    console.log(req.body.id);
    const objDeleteUser = await User.updateOne({
        _id: req.body.id
    },{
        isActive : false
    });
    res.redirect("showUser");
});

//Property Images
// router.get('/addPropertyImage', async (req, res) => {

//     const objProperty = await Property.find({isActive:true});
//     res.render("addPropertyImage.html", {operation:"insert",propertyData:objProperty});
// });

// router.post('/addPropertyImageEJS',upload.array('image'), async (req, res) => {
//     console.log(req.body);
//     req.files.map(async (file)=>{
//         const objPropertyImage = new PropertyImage();
//         objPropertyImage.propertyIDFK = req.body.propertyIDFK,
//         console.log("id"+req.body.propertyIDFK);
//         objPropertyImage.image = file.filename,
//         objPropertyImage.addedOn = new Date(),
//         objPropertyImage.isActive = true
//         const inserted = await objPropertyImage.save();
//     });
//     res.redirect("showPropertyImage");
// });

// router.get('/showPropertyImage', async (req, res) => {

//     let objPropertyImage = await PropertyImage.find({isActive: true})
//         .populate('propertyIDFK', 'propertyName');

//     // // return res.send(objStudent)

//     for (var i = 0; i < objPropertyImage.length; i++) {
//         objPropertyImage[i].property_value = objPropertyImage[i].propertyIDFK.propertyName
        
//         // console.log(objStudent[i].category_value)
//     }

//     // console.log("caetgory", objStudent[0].category_value)
    
//     res.render("showPropertyImage.html",{"data":objPropertyImage});

// });

//Property Images By Id
router.get('/addPropertyImage/:id', async (req, res) => {
    res.render("addPropertyImage.html", {operation:"insert",propertyData:req.params.id});
});

router.post('/addPropertyImageEJS',upload.array('image'), async (req, res) => {
    console.log(req.body);
    req.files.map(async (file)=>{
        const objPropertyImage = new PropertyImage();
        objPropertyImage.propertyIDFK = req.body.propertyIDFK,
        console.log("id "+req.body.propertyIDFK);
        objPropertyImage.image = file.filename,
        objPropertyImage.addedOn = new Date(),
        objPropertyImage.isActive = true
        const inserted = await objPropertyImage.save();
    });
    res.redirect("showPropertyImage/"+req.body.propertyIDFK);
});

router.get('/showPropertyImage/:id', async (req, res) => {

    let objPropertyImage = await PropertyImage.find({isActive: true,propertyIDFK:req.params.id})
        .populate('propertyIDFK', 'propertyName');

    // // return res.send(objStudent)

    for (var i = 0; i < objPropertyImage.length; i++) {
        objPropertyImage[i].property_value = objPropertyImage[i].propertyIDFK.propertyName
        
        // console.log(objStudent[i].category_value)
    }

    // console.log("caetgory", objStudent[0].category_value)
    
    res.render("showPropertyImage.html",{"data":objPropertyImage,"propertyData":req.params.id});

});

router.get('/fetchPropertyImage/:id', async (req, res) => {
    const fetchPropertyImageObj = await PropertyImage.findOne({
        _id: req.params.id
    });
    const objProperty = await Property.find();
    console.log(objProperty);
    res.render("addPropertyImage.html", {operation:"update",propertyImageData:fetchPropertyImageObj,propertyData:objProperty});
});

router.post('/deletePropertyImage', async (req, res) => {
    console.log(req.body.id);
    const objDeletePropertyImage = await PropertyImage.updateOne({
        _id: req.body.id
    },{
        isActive : false
    });
    res.redirect("showPropertyImage/"+req.body.propertyIDFK);
});



//Aminity
router.get('/addAminity', async (req, res) => {

    const objProperty = await PropertyType.find({isActive:true});
    res.render("addAminity.html", {operation:"insert",propertyTypeData:objProperty});
});

router.post('/addAminityEJS',async (req, res) => {
    console.log(req.body);
        const objAminity = new Aminity();
        objAminity.aminityName=req.body.aminityName;
        objAminity.propertyTypeIDFK = req.body.propertyTypeIDFK,
        console.log("id"+req.body.propertyTypeIDFK);   
        objAminity.addedOn = new Date(),
        objAminity.isActive = true
        const inserted = await objAminity.save();
    res.redirect("showAminity");
});

router.get('/showAminity', async (req, res) => {

    let objAminity = await Aminity.find({isActive: true})
        .populate('propertyTypeIDFK', 'typeName');

        console.log(objAminity);
    // // return res.send(objStudent)

    for (var i = 0; i < objAminity.length; i++) {
        objAminity[i].property_value = objAminity[i].propertyTypeIDFK.typeName
        
        // console.log(objStudent[i].category_value)
    }

    // console.log("caetgory", objStudent[0].category_value)
    
    res.render("showAminity.html",{"data":objAminity});

});

router.get('/fetchAminity/:id', async (req, res) => {
    const fetchAminityObj = await Aminity.findOne({
        _id: req.params.id
    });
    const objProperty = await PropertyType.find({isActive:true});
    console.log(objProperty);
    res.render("addAminity.html", {operation:"update",aminityData:fetchAminityObj,propertytypeData:objProperty});
});

router.post('/updateAminityEJS',async (req, res) => {
    console.log(req.body)
    const objAminity = await Aminity.updateOne({
        _id: req.body.id
    }, {
        propertyTypeIDFK : req.body.propertyTypeIDFK,
        aminityName : req.body.aminityName,
    });
    if (objAminity != null) {
        res.redirect("showAminity");
    } else {
        res.redirect("showAminity");
    }
});

router.post('/deleteAminity', async (req, res) => {
    console.log(req.body.id);
    const objDeleteAminity = await Aminity.updateOne({
        _id: req.body.id
    },{
        isActive : false
    });
    res.redirect("showAminity");
});

//Chat

// router.get('/showChat', async (req, res) => {

//     let objChat = await Chat.find({isActive: true})
//         .populate('userIDFK', ['userFname','userLname']);

//     // // return res.send(objStudent)

//     for (var i = 0; i < objChat.length; i++) {
//         objChat[i].user_value = objChat[i].userIDFK.userFname+" "+objChat[i].userIDFK.userLname
        
//         // console.log(objStudent[i].category_value)
//     }

//     // console.log("caetgory", objStudent[0].category_value)
    
//     res.render("showChat.html",{"data":objChat});

// });

//userRequest

router.get('/showUserRequest', async (req, res) => {

    let objRequest = await UserRequest.find({isActive: true})
    .populate('userIDFK', ['userFname','userLname'])
        .populate('propertyIDFK', 'propertyName');

    // // return res.send(objStudent)

    for (var i = 0; i < objRequest.length; i++) {
        objRequest[i].property_value = objRequest[i].propertyIDFK.propertyName;
        objRequest[i].user_value = objRequest[i].userIDFK.userFname+" "+objRequest[i].userIDFK.userLname;
        
        
        // console.log(objStudent[i].category_value)
    }

    // console.log("caetgory", objStudent[0].category_value)
    
    res.render("showUserRequest.html",{"data":objRequest});

});

router.get('/fetchRequest/:id', async (req, res) => {
    const fetchRequestObj = await UserRequest.findOne({
        _id: req.params.id
    });
    const objProperty = await Property.find({isActive:true});
    console.log(objProperty);
    res.render("showUserRequest.html", {operation:"update",requestData:fetchRequestObj,propertyData:objProperty});
});

router.post('/updateRequestEJS',async (req, res) => {
    console.log(req.body)
    const objUserRequest = await UserRequest.updateOne({
        _id: req.body.id
    }, {
        status:true
    });
    if (objUserRequest != null) {
        res.redirect("showUserRequest");
    } else {
        res.redirect("showUserRequest");
    }
});

//userReview
router.get('/showUserReview', async (req, res) => {

    let objReview = await UserReview.find({isActive: true})
    .populate('userIDFK', ['userFname','userLname'])
        .populate('propertyIDFK', 'propertyName');

    // // return res.send(objStudent)

    for (var i = 0; i < objReview.length; i++) {
        objReview[i].property_value = objReview[i].propertyIDFK.propertyName;
        objReview[i].user_value = objReview[i].userIDFK.userFname+" "+objReview[i].userIDFK.userLname;
        
        
        // console.log(objStudent[i].category_value)
    }

    // console.log("caetgory", objStudent[0].category_value)
    
    res.render("showUserReview.html",{"data":objReview});

});

//shortlisted
router.get('/showShortlist', async (req, res) => {

    let objShortlist = await Shortlisted.find({isActive: true})
    .populate('userIDFK', ['userFname','userLname','contact'])
        .populate('propertyIDFK', ['propertyName','rent','address','propertyImage']);

    // // return res.send(objStudent)

    for (var i = 0; i < objShortlist.length; i++) {
        objShortlist[i].property_value = objShortlist[i].propertyIDFK.propertyName;
        objShortlist[i].property_rent = objShortlist[i].propertyIDFK.rent;
        objShortlist[i].property_address = objShortlist[i].propertyIDFK.address;
        objShortlist[i].user_value = objShortlist[i].userIDFK.userFname+" "+objShortlist[i].userIDFK.userLname;
        objShortlist[i].user_contact = objShortlist[i].userIDFK.contact;
        objShortlist[i].property_image = objShortlist[i].propertyIDFK.propertyImage;
        
        // console.log(objStudent[i].category_value)
    }

    // console.log("caetgory", objStudent[0].category_value)
    
    res.render("showShortlist.html",{"data":objShortlist});

});

//Inquiry
router.get('/showInquiry', async (req, res) => {

    let objInquiry = await Inquiry.find({isActive: true})
    .populate('userIDFK', ['userFname','userLname'])
        .populate('propertyIDFK', 'propertyName');

    // // return res.send(objStudent)

    for (var i = 0; i < objInquiry.length; i++) {
        objInquiry[i].property_value = objInquiry[i].propertyIDFK.propertyName;
        objInquiry[i].user_value = objInquiry[i].userIDFK.userFname+" "+objInquiry[i].userIDFK.userLname;
    
        
        // console.log(objStudent[i].category_value)
    }

    // console.log("caetgory", objStudent[0].category_value)
    
    res.render("showInquiry.html",{"data":objInquiry});

});

//Visit

router.get('/showVisit', async (req, res) => {

    let objVisit = await Visit.find({isActive: true})
    .populate('userIDFK', ['userFname','userLname'])
        .populate('propertyIDFK', 'propertyName');

    // // return res.send(objStudent)

    for (var i = 0; i < objVisit.length; i++) {
        objVisit[i].property_value = objVisit[i].propertyIDFK.propertyName;
        objVisit[i].user_value = objVisit[i].userIDFK.userFname+" "+objVisit[i].userIDFK.userLname;
    
        
        // console.log(objStudent[i].category_value)
    }

    // console.log("caetgory", objStudent[0].category_value)
    
    res.render("showVisit.html",{"data":objVisit});

});

router.get('/fetchVisit/:id', async (req, res) => {
    const fetchVisitObj = await Visit.findOne({
        _id: req.params.id
    });
    const objProperty = await Property.find({isActive:true});
    console.log(objProperty);
    res.render("showVisit.html", {operation:"update",visitData:fetchVisitObj,propertyData:objProperty});
});

router.post('/updateVisitEJS',async (req, res) => {
    console.log(req.body)
    const objVisit = await Visit.updateOne({
        _id: req.body.id
    }, {
        status:true
    });
    if (objVisit != null) {
        res.redirect("showVisit");
    } else {
        res.redirect("showVisit");
    }
});

//payment
router.get('/showPayment', async (req, res) => {

    let objPayment = await Payment.find({isActive: true})
        .populate('propertyIDFK', 'propertyName');

    // // return res.send(objStudent)

    for (var i = 0; i < objPayment.length; i++) {
        objPayment[i].property_value = objPayment[i].propertyIDFK.propertyName;
        
    
        
        // console.log(objStudent[i].category_value)
    }

    // console.log("caetgory", objStudent[0].category_value)
    
    res.render("showPayment.html",{"data":objPayment});

});

module.exports = router;
