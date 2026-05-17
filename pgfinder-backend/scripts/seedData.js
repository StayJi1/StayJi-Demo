require('dotenv').config()
const mongoose = require('mongoose')
const dbConnect = require('../connection/dbconnect')
const User = require('../models/userMaster')
const PropertyType = require('../models/propertyType')
const Property = require('../models/propertyMaster')
const PropertyImage = require('../models/propertyImage')

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
  userPassword: 'Host1234',
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
  ['Hostel', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'],
  ['Studio', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80'],
  ['Shared Room', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
].map(([typeName, image]) => ({ typeName, image, addedOn: now(), isActive: true }))

const cities = [
  { cityName: 'Mumbai', areas: ['Andheri West', 'Vashi', 'Powai', 'Bandra', 'Dadar'] },
  { cityName: 'Bangalore', areas: ['Koramangala', 'Indiranagar', 'BTM Layout', 'Whitefield', 'Banashankari'] },
  { cityName: 'Pune', areas: ['Hinjewadi', 'Baner', 'Kothrud', 'Viman Nagar', 'Wakad'] },
  { cityName: 'Delhi', areas: ['Lodhi Road', 'South Extension', 'Karol Bagh', 'Saket', 'Mukherjee Nagar'] },
  { cityName: 'Hyderabad', areas: ['Jubilee Hills', 'Gachibowli', 'Madhapur', 'Ameerpet', 'Kondapur'] },
  { cityName: 'Chennai', areas: ['Anna Nagar', 'Taramani', 'Velachery', 'Adyar', 'Nungambakkam'] },
  { cityName: 'Kolkata', areas: ['Park Street', 'Salt Lake', 'New Town', 'Ballygunge', 'Rajarhat'] },
  { cityName: 'Jaipur', areas: ['Civil Lines', 'Malviya Nagar', 'C Scheme', 'Mansarovar', 'Vaishali Nagar'] },
  { cityName: 'Ahmedabad', areas: ['Navrangpura', 'Satellite', 'Bopal', 'Prahlad Nagar', 'Vastrapur'] },
  { cityName: 'Gurgaon', areas: ['Sector 44', 'DLF Phase 3', 'Sohna Road', 'Cyber City', 'Sector 56'] },
]

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
  const city = cities[index % cities.length]
  const areaName = city.areas[index % city.areas.length]
  const sharing = ['Single', '2 Sharing', '3 Sharing', '4 Sharing'][index % 4]
  const genderType = ['Boys', 'Girls', 'Co-ed'][index % 3]
  const rent = 6500 + ((index * 725) % 8500)
  const type = types[index % types.length]

  return {
    userIDFK: owners[index % owners.length]._id,
    propertyName,
    description: `${genderType} ${type.typeName.toLowerCase()} in ${areaName} with clean furnished rooms, reliable food, fast WiFi, and easy access to colleges, offices, cafes, and public transport.`,
    address: `${areaName}, ${city.cityName}`,
    rent: String(rent),
    sharing,
    genderType,
    areaName,
    cityName: city.cityName,
    propertyTypeIDFK: type._id,
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
    await Property.deleteMany({ propertyName: { $in: propertyNames } })
    await PropertyImage.deleteMany({})

    const inserted = await Property.insertMany(properties)
    const gallery = inserted.flatMap((property, index) => [
      { propertyIDFK: property._id, image: imageUrls[index % imageUrls.length], addedOn: now(), isActive: true },
      { propertyIDFK: property._id, image: imageUrls[(index + 1) % imageUrls.length], addedOn: now(), isActive: true },
      { propertyIDFK: property._id, image: imageUrls[(index + 2) % imageUrls.length], addedOn: now(), isActive: true },
    ])
    await PropertyImage.insertMany(gallery)

    console.log(`Inserted ${inserted.length} dummy PG properties and ${gallery.length} gallery images.`)
    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Seed failed:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

seed()
