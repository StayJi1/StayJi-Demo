require('dotenv').config()
const mongoose = require('mongoose')
require('../connection/dbconnect')

const User = require('../models/userMaster')
const Property = require('../models/propertyMaster')
const Inquiry = require('../models/inquiryMaster')
const Visit = require('../models/visitDetails')
const Shortlist = require('../models/shortlistMaster')
const UserReview = require('../models/userReview')
const LeadEvent = require('../models/leadEvent')
const MoveInConfirmation = require('../models/moveInConfirmation')
const AdminMessage = require('../models/adminMessage')

const apply = process.argv.includes('--apply')
const includeInactive = process.argv.includes('--include-inactive')

const nonAdminUserFilter = { userType: { $nin: ['Admin', 'admin'] } }
const propertyFilter = includeInactive ? {} : { status: { $ne: 'archived' } }
const relatedFilter = includeInactive ? {} : { isActive: { $ne: false } }

const run = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise()
  }

  const counts = {
    users: await User.countDocuments(nonAdminUserFilter),
    properties: await Property.countDocuments(propertyFilter),
    inquiries: await Inquiry.countDocuments(relatedFilter),
    visits: await Visit.countDocuments(relatedFilter),
    shortlists: await Shortlist.countDocuments(relatedFilter),
    reviews: await UserReview.countDocuments(relatedFilter),
    leadEvents: await LeadEvent.countDocuments(relatedFilter),
    moveIns: await MoveInConfirmation.countDocuments(relatedFilter),
    adminMessages: await AdminMessage.countDocuments(relatedFilter),
  }

  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', includeInactive, counts }, null, 2))

  if (!apply) {
    console.log('Dry run only. Re-run with: npm run mark:current-dummy -- --apply')
    return
  }

  const [users, properties, inquiries, visits, shortlists, reviews, leadEvents, moveIns, adminMessages] = await Promise.all([
    User.updateMany(nonAdminUserFilter, { $set: { isDummy: true, status: 'demo' } }),
    Property.updateMany(propertyFilter, { $set: { isDummy: true, status: 'demo' } }),
    Inquiry.updateMany(relatedFilter, { $set: { isDummy: true } }),
    Visit.updateMany(relatedFilter, { $set: { isDummy: true } }),
    Shortlist.updateMany(relatedFilter, { $set: { isDummy: true } }),
    UserReview.updateMany(relatedFilter, { $set: { isDummy: true } }),
    LeadEvent.updateMany(relatedFilter, { $set: { isDummy: true } }),
    MoveInConfirmation.updateMany(relatedFilter, { $set: { isDummy: true } }),
    AdminMessage.updateMany(relatedFilter, { $set: { isDummy: true } }),
  ])

  console.log(JSON.stringify({
    updated: {
      users: users.modifiedCount || 0,
      properties: properties.modifiedCount || 0,
      inquiries: inquiries.modifiedCount || 0,
      visits: visits.modifiedCount || 0,
      shortlists: shortlists.modifiedCount || 0,
      reviews: reviews.modifiedCount || 0,
      leadEvents: leadEvents.modifiedCount || 0,
      moveIns: moveIns.modifiedCount || 0,
      adminMessages: adminMessages.modifiedCount || 0,
    },
  }, null, 2))
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
