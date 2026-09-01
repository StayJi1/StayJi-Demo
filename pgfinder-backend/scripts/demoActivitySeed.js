require('dotenv').config()
const mongoose = require('mongoose')
const dbConnect = require('../connection/dbconnect')
const User = require('../models/userMaster')
const Property = require('../models/propertyMaster')
const Shortlist = require('../models/shortlistMaster')
const Inquiry = require('../models/inquiryMaster')
const Visit = require('../models/visitDetails')
const Chat = require('../models/chatMaster')
const Notification = require('../models/notification')
const UserReview = require('../models/userReview')

const vendorsEmails = Array.from({length:6}, (_,i)=>`vendor${i+1}@stayji.demo`)
const usersEmails = Array.from({length:6}, (_,i)=>`user${i+1}@stayji.demo`)
const admins = ['admin1@stayji.demo','admin2@stayji.demo']

const areas = ['Electronic City','Indiranagar','Koramangala','Whitefield','HSR Layout','Bellandur','BTM Layout','Jayanagar']

async function ensureDemoPropertiesForVendor(vendor, startIndex=0) {
  const created = []
  for (let k=0;k<3;k++) {
    const area = areas[(startIndex + k) % areas.length]
    const propName = `Demo ${area} Property for ${vendor.userFname} ${vendor.userLname} #${k+1}`
    const rent = String(7000 + ((startIndex+k)*1000))
    const doc = await Property.findOneAndUpdate(
      { propertyName: propName, vendorId: vendor._id },
      { $setOnInsert: {
        userIDFK: vendor._id,
        vendorId: vendor._id,
        propertyName: propName,
        description: `${propName} — demo listing in ${area}, Bangalore.`,
        address: `${k+1} Demo Lane, ${area}, Bangalore`,
        rent,
        sharing: 'Single',
        genderType: k%2===0? 'Boys':'Girls',
        areaName: area,
        localitySlug: area.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
        cityName: 'Bangalore',
        stateName: 'Karnataka',
        latitude: 12.95 + k*0.001,
        longitude: 77.6 + k*0.001,
        propertyTypeIDFK: null,
        aminityFeatures: 'WiFi, Power backup, Hot water',
        propertyImage: '',
        propertyImageUrls: [],
        propertyCategory: 'PG',
        pricingUnit: 'month',
        availableBeds: 3,
        roomInventory: [],
        verificationChecklist: { identity: true, ownership: true, photos: true, location: true, pricing: true, safety: true },
        vacancyStatus: 'Limited beds available',
        isAvailable: true,
        approvalStatus: 'Approved',
        addedOn: new Date().toISOString(),
        isActive: true,
        isDummy: true,
      } }, { upsert: true, new: true })
    created.push(doc)
  }
  return created
}

async function ensureDemoActivity() {
  await dbConnect
  if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise()

  const vendors = await Promise.all(vendorsEmails.map((e)=> User.findOne({ userEmail: new RegExp(`^${e}$`, 'i') })))
  const users = await Promise.all(usersEmails.map((e)=> User.findOne({ userEmail: new RegExp(`^${e}$`, 'i') })))

  // ensure properties for vendors
  let idx = 0
  const vendorProps = {}
  for (const v of vendors) {
    if (!v) continue
    const props = await ensureDemoPropertiesForVendor(v, idx)
    vendorProps[v.userEmail] = props.map(p=>p._id)
    idx += 1
  }

  // Create shortlists: each user shortlists 2 properties from different vendors
  for (let i=0;i<users.length;i++) {
    const user = users[i]
    if (!user) continue
    const firstVendor = vendors[i % vendors.length]
    const secondVendor = vendors[(i+1) % vendors.length]
    const firstProp = (vendorProps[firstVendor.userEmail]||[])[0]
    const secondProp = (vendorProps[secondVendor.userEmail]||[])[1]
    if (firstProp) await Shortlist.findOneAndUpdate({ propertyIDFK:firstProp, userIDFK:user._id }, { $setOnInsert: { propertyIDFK:firstProp, userIDFK:user._id, addedOn: new Date().toISOString(), isActive:true } }, { upsert:true })
    if (secondProp) await Shortlist.findOneAndUpdate({ propertyIDFK:secondProp, userIDFK:user._id }, { $setOnInsert: { propertyIDFK:secondProp, userIDFK:user._id, addedOn: new Date().toISOString(), isActive:true } }, { upsert:true })

    // create an inquiry on firstProp
    if (firstProp) {
        try {
          await Inquiry.findOneAndUpdate({ propertyIDFK:firstProp, userIDFK:user._id, subject: new RegExp('^Demo Inquiry') }, { $setOnInsert: { propertyIDFK:firstProp, propertyId:firstProp, vendorId:firstVendor._id, userIDFK:user._id, subject: `Demo Inquiry from ${user.userFname}`, description: `Is ${firstVendor.userFname} available for quick visit?`, preferredVisitTime: 'Anytime', addedOn: new Date().toISOString(), isActive: true } }, { upsert:true })
        } catch (e) { console.error('Inquiry upsert failed for user', user.userEmail, e && e.message) }
    }

    // create a visit request
    if (secondProp) {
      try {
        await Visit.findOneAndUpdate({ propertyIDFK:secondProp, userIDFK:user._id, visitDate: { $exists: true } }, { $setOnInsert: { propertyIDFK:secondProp, propertyId:secondProp, vendorId:secondVendor._id, userIDFK:user._id, visitDate: new Date().toISOString().slice(0,10), visitTime: '10:00 AM', addedOn: new Date().toISOString(), isActive: true } }, { upsert:true })
      } catch (e) { console.error('Visit upsert failed for user', user.userEmail, e && e.message) }
    }

    // create a review for firstProp
    if (firstProp) {
      try {
        await UserReview.findOneAndUpdate({ propertyIDFK:firstProp, userIDFK:user._id, details: new RegExp('Demo review') }, { $setOnInsert: { propertyIDFK:firstProp, propertyId:firstProp, userIDFK:user._id, rating: 4, details: `Demo review by ${user.userFname}`, tags: ['demo','seed'], sentiment: 'positive', addedOn: new Date().toISOString(), isActive: true } }, { upsert:true })
      } catch (e) { console.error('Review upsert failed for user', user.userEmail, e && e.message) }
    }

    // create chat message between user and vendor
    if (firstProp) {
      try {
        await Chat.findOneAndUpdate({ fromUserIDFK:user._id, toUserIDFK:firstVendor._id, text: new RegExp('Demo chat') }, { $setOnInsert: { fromUserIDFK:user._id, toUserIDFK:firstVendor._id, text: `Demo chat message from ${user.userFname}`, metadata: { propertyId: firstProp }, addedOn: new Date().toISOString() } }, { upsert:true })
      } catch (e) { console.error('Chat upsert failed for user', user.userEmail, e && e.message) }
    }
  }

  // Create notifications for vendors about inquiries/visits
  for (const v of vendors) {
    if (!v) continue
    const props = vendorProps[v.userEmail] || []
    for (const pid of props.slice(0,2)) {
      try {
        await Notification.findOneAndUpdate({ recipientId: v._id, propertyId: pid, message: new RegExp('Demo notification') }, { $setOnInsert: { recipientId: v._id, actorId: null, propertyId: pid, message: `Demo notification: new demo lead for property`, addedOn: new Date().toISOString(), isActive: true } }, { upsert:true })
      } catch (e) { console.error('Notification upsert failed for vendor', v.userEmail, e && e.message) }
    }
  }

  console.log('Demo activity ensured for users and vendors')
  process.exit(0)
}

ensureDemoActivity().catch(e=>{ console.error(e && e.message); process.exit(1) })
