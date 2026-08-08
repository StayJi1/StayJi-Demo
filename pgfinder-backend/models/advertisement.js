const mongoose = require('mongoose')

const advertisementSchema = new mongoose.Schema({
  agencyName: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  imageUrl: { type: String, default: '' },
  targetUrl: { type: String, default: '' },
  placement: { type: String, enum: ['home', 'browse-sidebar', 'locality-sidebar', 'property-sidebar', 'listing-sidebar', 'both'], default: 'both', index: true },
  startAt: { type: Date, default: Date.now },
  endAt: { type: Date },
  priority: { type: Number, default: 0, index: true },
  isActive: { type: Boolean, default: true, index: true },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  billingStatus: { type: String, enum: ['unbilled', 'invoiced', 'paid', 'overdue'], default: 'unbilled', index: true },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'userMaster' },
}, { timestamps: true })

advertisementSchema.index({ isActive: 1, placement: 1, priority: -1, startAt: -1 })

module.exports = mongoose.model('advertisement', advertisementSchema)
