require('dotenv').config()
const mongoose = require('mongoose')
const dbConnect = require('../connection/dbconnect')
const User = require('../models/userMaster')
const Property = require('../models/propertyMaster')

const vendors = Array.from({length:6}, (_,i)=>`vendor${i+1}@stayji.demo`)
const users = Array.from({length:6}, (_,i)=>`user${i+1}@stayji.demo`)
const admins = ['admin1@stayji.demo','admin2@stayji.demo']

;(async ()=>{
  await dbConnect
  if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise()
  console.log('DEMO LOGIN CREDENTIALS')
  console.log('\nUSERS\n')
  for (const email of users) {
    const u = await User.findOne({ userEmail: new RegExp(`^${email}$`, 'i') }).lean()
    if (!u) continue
    console.log(`- Name: ${(u.userFname||'') + (u.userLname?(' '+u.userLname):'')}`)
    console.log(`  Login ID: ${email}`)
    console.log(`  Password: User123!`)
    console.log('')
  }

  console.log('\nPG OWNERS\n')
  for (const email of vendors) {
    const v = await User.findOne({ userEmail: new RegExp(`^${email}$`, 'i') }).lean()
    if (!v) continue
    const props = await Property.find({ vendorId: v._id }).select({ propertyName:1, areaName:1 }).lean()
    console.log(`- Name: ${(v.userFname||'') + (v.userLname?(' '+v.userLname):'')}`)
    console.log(`  Login ID: ${email}`)
    console.log(`  Password: Vendor123!`)
    console.log('  Associated properties:')
    props.forEach((p)=> console.log(`    - ${p.propertyName} (${p.areaName || 'Unknown area'})`))
    console.log('')
  }

  console.log('\nADMINS\n')
  for (const email of admins) {
    const a = await User.findOne({ userEmail: new RegExp(`^${email}$`, 'i') }).lean()
    if (!a) continue
    console.log(`- Name: ${(a.userFname||'') + (a.userLname?(' '+a.userLname):'')}`)
    console.log(`  Login ID: ${email}`)
    console.log(`  Password: Admin123!`)
    console.log('')
  }

  const totalProps = await Property.countDocuments({})
  const visibleFirstPage = await Property.find({ cityName: /Bangalore/i }).limit(Number(process.env.DEFAULT_PAGE_LIMIT||24)).countDocuments()
  const areas = await Property.distinct('areaName', { cityName: /Bangalore/i })
  console.log('Summary:')
  console.log('Total demo properties in DB:', totalProps)
  console.log('Properties visible on first page (limit):', visibleFirstPage)
  console.log('Areas covered (sample):', areas.slice(0,10).join(', '))
  process.exit(0)
})().catch(e=>{ console.error(e); process.exit(1) })
