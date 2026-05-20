require('dotenv').config()
const mongoose = require('mongoose')
const dbConnect = require('../connection/dbconnect')
const User = require('../models/userMaster')
const PropertyType = require('../models/propertyType')
const Property = require('../models/propertyMaster')
const PropertyImage = require('../models/propertyImage')
const UserReview = require('../models/userReview')
const { hashPassword } = require('../utils/security')

const now = () => new Date().toISOString()

const ownerData = [
  ['Aarav', 'Shah', 'aarav.host@example.com', 'Male'],
  ['Neha', 'Patel', 'neha.host@example.com', 'Female'],
  ['Rohit', 'Sharma', 'rohit.host@example.com', 'Male'],
  ['Sneha', 'Reddy', 'sneha.host@example.com', 'Female'],
  ['Vikram', 'Joshi', 'vikram.host@example.com', 'Male'],
  ['Priya', 'Nair', 'priya.host@example.com', 'Female'],
].map(([userFname, userLname, userEmail, gender]) => ({
  userName: `${userFname} ${userLname}`,
  userFname,
  userLname,
  userEmail,
  userPassword: hashPassword('Host1234'),
  dob: '',
  gender,
  contact: '9876543210',
  occupation: 'PG Owner',
  userType: 'Vendor',
  profile: '',
  addedOn: now(),
  isActive: true,
}))

const propertyTypes = [
  ['PG', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'],
  ['Flat', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80'],
  ['Hotel', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80'],
  ['Hostel', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'],
  ['Studio', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80'],
  ['Shared Room', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
].map(([typeName, image]) => ({ typeName, image, addedOn: now(), isActive: true }))

const slugify = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const localities = [
  ['Whitefield', 12.9698, 77.7500],
  ['HSR Layout', 12.9116, 77.6474],
  ['Electronic City', 12.8452, 77.6602],
  ['Marathahalli', 12.9569, 77.7011],
  ['Bellandur', 12.9304, 77.6784],
  ['Koramangala', 12.9352, 77.6245],
  ['Indiranagar', 12.9784, 77.6408],
  ['Hebbal', 13.0358, 77.5970],
  ['Yelahanka', 13.1007, 77.5963],
  ['Sarjapur Road', 12.9063, 77.6938],
  ['JP Nagar', 12.9063, 77.5857],
  ['BTM Layout', 12.9166, 77.6101],
  ['KR Puram', 13.0076, 77.6959],
].map(([areaName, lat, lng]) => ({ cityName: 'Bangalore', areaName, lat, lng }))

const names = [
  'Blue Haven PG',
  'Serene Stays',
  'Campus Comfort',
  'StudyEdge Residence',
  'Urban Nest PG',
  'Kolkata Comforts',
  'Green Valley Hostel',
  'Metro Elite PG',
  'Royal Residency',
  'City Lights PG',
  'Luxury Loft Hostel',
  'Heritage House PG',
  'Southside Stay',
  'Lakeview Lodge',
  'Downtown Dwell',
  'Heritage Homes PG',
  'City Center Hostel',
  'Seaside Stay PG',
  'Parkview PG',
  'Herbal Haven PG',
  'Startup Stay',
  'Heritage Heights PG',
  'Oakwood PG',
  'Sunrise Suites',
  'Maple Leaf PG',
  'Silverline Hostel',
  'Skyline Comforts',
  'Pearl House PG',
  'Prime Student Stay',
  'The Study House',
  'Metroline PG',
  'Garden View Hostel',
  'Elite Living PG',
  'Harmony House',
  'Budget Nest PG',
  'Urban Hive Hostel',
  'Golden Gate PG',
  'Cedar Rooms',
  'Northstar Stay',
  'Cloud Nine PG',
  'Comfort Corner',
  'The Common Room',
  'Crescent Stay',
  'Nova Nest PG',
  'Palm Grove Hostel',
  'Anchor House PG',
  'Hilltop Residence',
  'SmartStay PG',
  'MetroHub Hostel',
  'Cozy Court PG',
]

const imageUrls = [
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
]

const amenities = [
  'WiFi, Meals, Laundry, CCTV, Power backup',
  'WiFi, Meals, Housekeeping, Study room, Security',
  'WiFi, AC, Laundry, Rooftop lounge, Parking',
  'WiFi, Meals, Hot water, Common TV room, Study table',
  'WiFi, Gym access, Meals, Cleaning, Secure entry',
]

const buildProperties = (owners, types) => names.map((propertyName, index) => {
  const locality = localities[index % localities.length]
  const areaName = locality.areaName
  const sharing = ['Single', '2 Sharing', '3 Sharing', '4 Sharing'][index % 4]
  const genderType = ['Boys', 'Girls', 'Co-ed'][index % 3]
  const rent = 6500 + ((index * 725) % 8500)
  const type = types[index % types.length]
  const propertyCategory = ['PG', 'Flat', 'Hotel', 'Hostel'][index % 4]

  return {
    userIDFK: owners[index % owners.length]._id,
    vendorId: owners[index % owners.length]._id,
    propertyName,
    description: `${genderType} ${propertyCategory.toLowerCase()} in ${areaName} with clean furnished rooms, reliable food, fast WiFi, and easy access to colleges, offices, cafes, and public transport.`,
    address: `${areaName}, Bangalore`,
    rent: String(rent),
    sharing,
    genderType,
    areaName,
    localitySlug: slugify(areaName),
    cityName: 'Bangalore',
    latitude: locality.lat + ((index % 5) * 0.002),
    longitude: locality.lng + ((index % 7) * 0.002),
    propertyTypeIDFK: type._id,
    propertyCategory,
    isFeatured: index % 6 === 0,
    boostScore: index % 6 === 0 ? 20 : index % 5,
    localityPriority: 100 - index,
    rating: 4 + ((index % 10) / 10),
    approvalStatus: 'Approved',
    roomInventory: [
      { sharingType: 'Single sharing', totalRooms: 6, vacantRooms: index % 3, bedsPerRoom: 1, vacantBeds: index % 3, monthlyRent: String(rent + 2500) },
      { sharingType: 'Double sharing', totalRooms: 8, vacantRooms: (index + 1) % 4, bedsPerRoom: 2, vacantBeds: ((index + 1) % 4) * 2, monthlyRent: String(rent) },
      { sharingType: 'Triple sharing', totalRooms: 5, vacantRooms: (index + 2) % 3, bedsPerRoom: 3, vacantBeds: ((index + 2) % 3) * 3, monthlyRent: String(Math.max(4500, rent - 1800)) },
    ],
    aminityFeatures: amenities[index % amenities.length],
    propertyImage: imageUrls[index % imageUrls.length],
    isAvailable: index % 9 !== 0,
    addedOn: now(),
    isActive: true,
  }
})

async function upsertByEmail(owner) {
  return User.findOneAndUpdate({ userEmail: owner.userEmail }, { $set: owner }, { upsert: true, new: true })
}

async function upsertType(type) {
  return PropertyType.findOneAndUpdate({ typeName: type.typeName }, { $set: type }, { upsert: true, new: true })
}

async function seed() {
  try {
    await dbConnect

    const owners = await Promise.all(ownerData.map(upsertByEmail))
    console.log(`Ready with ${owners.length} vendor accounts.`)

    const types = await Promise.all(propertyTypes.map(upsertType))
    console.log(`Ready with ${types.length} property types.`)

    const properties = buildProperties(owners, types)
    const propertyNames = properties.map((property) => property.propertyName)
    const oldSeededProperties = await Property.find({ propertyName: { $in: propertyNames } }).select('_id')
    await PropertyImage.deleteMany({ propertyIDFK: { $in: oldSeededProperties.map((property) => property._id) } })
    await UserReview.deleteMany({ propertyIDFK: { $in: oldSeededProperties.map((property) => property._id) } })
    await Property.deleteMany({ propertyName: { $in: propertyNames } })

    const inserted = await Property.insertMany(properties)
    const gallery = inserted.flatMap((property, index) => [
      { propertyIDFK: property._id, image: imageUrls[index % imageUrls.length], addedOn: now(), isActive: true },
      { propertyIDFK: property._id, image: imageUrls[(index + 1) % imageUrls.length], addedOn: now(), isActive: true },
      { propertyIDFK: property._id, image: imageUrls[(index + 2) % imageUrls.length], addedOn: now(), isActive: true },
    ])
    await PropertyImage.insertMany(gallery)
    const reviewTexts = [
      'Food quality is reliable, rooms are clean, and the commute to office areas is manageable.',
      'Good safety setup with CCTV and responsive staff. Best for students who want predictable meals.',
      'WiFi and laundry worked well during my stay. The locality has enough cafes and grocery stores nearby.',
      'Budget-friendly compared with nearby co-living spaces, with transparent rent and deposit terms.',
    ]
    const reviews = inserted.flatMap((property, index) => [0, 1, 2].map((offset) => ({
      propertyIDFK: property._id,
      propertyId: property._id,
      userIDFK: owners[(index + offset) % owners.length]._id,
      userId: owners[(index + offset) % owners.length]._id,
      rating: String(4 + ((index + offset) % 10) / 10),
      details: reviewTexts[(index + offset) % reviewTexts.length],
      addedOn: now(),
      isActive: true,
    })))
    await UserReview.insertMany(reviews)

    console.log(`Inserted ${inserted.length} Bangalore properties, ${gallery.length} gallery images, and ${reviews.length} reviews.`)
    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

seed()
