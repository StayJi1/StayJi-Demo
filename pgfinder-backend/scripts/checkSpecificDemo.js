require('dotenv').config()
const mongoose = require('mongoose')
const dbConnect = require('../connection/dbconnect')
const User = require('../models/userMaster')
const { verifyPassword } = require('../utils/security')

const emails = [
  ...Array.from({length:6}, (_,i)=>`vendor${i+1}@stayji.demo`),
  ...Array.from({length:6}, (_,i)=>`user${i+1}@stayji.demo`),
  'admin1@stayji.demo','admin2@stayji.demo'
]

;(async ()=>{
  await dbConnect
  if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise()
  for (const email of emails) {
    const user = await User.findOne({ userEmail: new RegExp(`^${email}$`, 'i') }).lean()
    if (!user) {
      console.log(email, 'MISSING')
      continue
    }
    const expected = user.userType && user.userType.toLowerCase().startsWith('vend') ? 'Vendor123!' : (user.userType && user.userType.toLowerCase().startsWith('adm') ? 'Admin123!' : 'User123!')
    const ok = verifyPassword(expected, user.userPassword)
    console.log(email, '|', user.userType, '| password-ok:', ok)
  }
  process.exit(0)
})().catch(e=>{ console.error(e); process.exit(1) })
