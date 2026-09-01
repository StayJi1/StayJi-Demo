require('dotenv').config()
const mongoose = require('mongoose')
const dbConnect = require('../connection/dbconnect')
const User = require('../models/userMaster')
const Property = require('../models/propertyMaster')
const PropertyType = require('../models/propertyType')
const Area = require('../models/areaMaster')
const { hashPassword } = require('../utils/security')

const DEMO_EMAIL_DOMAIN = 'stayji.demo'

async function ensure() {
  await dbConnect
  if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise()

  // Ensure a property type exists
  const defaultType = await PropertyType.findOneAndUpdate(
    { typeName: 'PG' },
    { $set: { typeName: 'PG', isActive: true, addedOn: new Date().toISOString() } },
    { upsert: true, new: true }
  )

  // Ensure area exists for Electronic City
  await Area.findOneAndUpdate(
    { cityName: 'Bangalore', areaName: 'Electronic City' },
    { $set: { cityName: 'Bangalore', areaName: 'Electronic City', isActive: true, addedOn: new Date().toISOString() } },
    { upsert: true }
  )

  const demoVendors = []
  for (let i = 1; i <= 6; i += 1) {
    const email = `vendor${i}@${DEMO_EMAIL_DOMAIN}`
    const name = `Demo Vendor ${i}`
    const vendor = await User.findOneAndUpdate(
      { userEmail: new RegExp(`^${email}$`, 'i') },
      {
        $setOnInsert: {
          userName: name,
          userFname: name.split(' ')[0],
          userLname: name.split(' ')[1] || 'Owner',
          userEmail: email,
          userPassword: hashPassword('Vendor123!'),
          userType: 'Vendor',
          city: 'Bangalore',
          cityName: 'Bangalore',
          contact: `90000000${String(10 + i).padStart(2, '0')}`,
          verificationStatus: 'Verified',
          isActive: true,
          addedOn: new Date().toISOString(),
        },
      },
      { upsert: true, new: true }
    )
    demoVendors.push(vendor)
  }

  const demoUsers = []
  for (let i = 1; i <= 6; i += 1) {
    const email = `user${i}@${DEMO_EMAIL_DOMAIN}`
    const name = `Demo User ${i}`
    const user = await User.findOneAndUpdate(
      { userEmail: new RegExp(`^${email}$`, 'i') },
      {
        $setOnInsert: {
          userName: name,
          userFname: name.split(' ')[0],
          userLname: name.split(' ')[1] || 'Guest',
          userEmail: email,
          userPassword: hashPassword('User123!'),
          userType: 'User',
          city: 'Bangalore',
          contact: `90000000${String(20 + i).padStart(2, '0')}`,
          verificationStatus: 'Verified',
          isActive: true,
          addedOn: new Date().toISOString(),
        },
      },
      { upsert: true, new: true }
    )
    demoUsers.push(user)
  }

  const demoAdmins = []
  for (let i = 1; i <= 2; i += 1) {
    const email = `admin${i}@${DEMO_EMAIL_DOMAIN}`
    const name = `Demo Admin ${i}`
    const admin = await User.findOneAndUpdate(
      { userEmail: new RegExp(`^${email}$`, 'i') },
      {
        $setOnInsert: {
          userName: name,
          userFname: name.split(' ')[0],
          userLname: name.split(' ')[1] || 'Admin',
          userEmail: email,
          userPassword: hashPassword('Admin123!'),
          userType: 'Admin',
          city: 'Bangalore',
          contact: `90000000${String(30 + i).padStart(2, '0')}`,
          verificationStatus: 'Verified',
          isActive: true,
          addedOn: new Date().toISOString(),
        },
      },
      { upsert: true, new: true }
    )
    demoAdmins.push(admin)
  }

  // Create a few demo properties in Electronic City
  for (let i = 0; i < 8; i += 1) {
    const vendor = demoVendors[i % demoVendors.length]
    const propName = `Demo Electronic City Property ${i + 1}`
    await Property.findOneAndUpdate(
      { propertyName: propName, vendorId: vendor._id },
      {
        $setOnInsert: {
          userIDFK: vendor._id,
          vendorId: vendor._id,
          propertyName: propName,
          description: `${propName} - Demo listing in Electronic City, Bangalore`,
          address: `${i + 1} Demo St, Electronic City, Bangalore`,
          rent: String(7000 + (i * 500)),
          sharing: 'Single',
          genderType: i % 2 === 0 ? 'Boys' : 'Girls',
          areaName: 'Electronic City',
          localitySlug: 'electronic-city',
          cityName: 'Bangalore',
          stateName: 'Karnataka',
          latitude: 12.845 + i * 0.0001,
          longitude: 77.660 + i * 0.0001,
          propertyTypeIDFK: defaultType._id,
          aminityFeatures: 'WiFi, Power backup, Hot water',
          propertyImage: '',
          propertyImageUrls: [],
          propertyCategory: 'PG',
          pricingUnit: 'month',
          availableBeds: 5,
          roomInventory: [],
          verificationChecklist: { identity: true, ownership: true, photos: true, location: true, pricing: true, safety: true },
          vacancyStatus: 'Limited beds available',
          isAvailable: true,
          approvalStatus: 'Approved',
          addedOn: new Date().toISOString(),
          isActive: true,
          isDummy: true,
        },
      },
      { upsert: true, new: true }
    )
  }

  console.log('Demo seed complete. Demo emails domain:', DEMO_EMAIL_DOMAIN)
  process.exit(0)
}

ensure().catch((err) => {
  console.error('Demo seed failed:', err && err.message ? err.message : err)
  process.exit(1)
})
