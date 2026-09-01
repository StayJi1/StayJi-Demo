require('dotenv').config()
const mongoose = require('mongoose')
const dbConnect = require('../connection/dbconnect')
const User = require('../models/userMaster')
const Property = require('../models/propertyMaster')
const { verifyPassword } = require('../utils/security')

const DEMO_EMAIL_DOMAIN = 'stayji.demo'

async function run() {
  await dbConnect
  if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise()

  const demoUsers = await User.find({ userEmail: new RegExp(`@${DEMO_EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i') }).lean()
  console.log('Found demo users:', demoUsers.length)
  demoUsers.forEach((u) => {
    const expected = u.userType && u.userType.toLowerCase().startsWith('vend') ? 'Vendor123!' : (u.userType && u.userType.toLowerCase().startsWith('adm') ? 'Admin123!' : 'User123!')
    const ok = verifyPassword(expected, u.userPassword)
    console.log('-', ([u.userFname, u.userLname].filter(Boolean).join(' ') || u.userName || ''), '|', u.userEmail, '| role:', u.userType, '| password-ok:', ok)
  })

  const totalProperties = await Property.countDocuments({ cityName: /Bangalore/i })
  console.log('Total properties in Bangalore:', totalProperties)

  const areas = await Property.aggregate([
    { $match: { cityName: /Bangalore/i } },
    { $group: { _id: '$areaName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])
  console.log('Top areas:')
  areas.slice(0, 10).forEach((a) => console.log(' -', a._id || '(no area)', ':', a.count))

  const sampleList = await Property.find({ cityName: /Bangalore/i }).select({ propertyName:1, areaName:1, cityName:1, propertyImage:1, rent:1, vendorId:1, isDummy:1, isActive:1 }).limit(10).lean()
  console.log('Sample properties (10):')
  sampleList.forEach((p) => console.log(' -', p.propertyName, '|', p.areaName, '| rent:', p.rent, '| vendor:', p.vendorId, '| isDummy:', p.isDummy))

  process.exit(0)
}

run().catch((e) => { console.error(e && e.message); process.exit(1) })
