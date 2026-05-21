require('dotenv').config()
const mongoose = require('mongoose')
const dbConnect = require('../connection/dbconnect')
const User = require('../models/userMaster')
const PropertyType = require('../models/propertyType')
const Property = require('../models/propertyMaster')
const PropertyImage = require('../models/propertyImage')
const UserReview = require('../models/userReview')
const Shortlist = require('../models/shortlistMaster')
const Inquiry = require('../models/inquiryMaster')
const Visit = require('../models/visitDetails')
const Chat = require('../models/chatMaster')
const Notification = require('../models/notification')
const LeadEvent = require('../models/leadEvent')
const MoveInConfirmation = require('../models/moveInConfirmation')
const Payment = require('../models/paymentMaster')
const AdminMessage = require('../models/adminMessage')
const Area = require('../models/areaMaster')
const UserRequest = require('../models/userRequest')
const { hashPassword } = require('../utils/security')

const DEMO_EMAIL_DOMAIN = 'stayji.demo'
const USER_COUNT = 240
const VENDOR_COUNT = 64
const PROPERTY_COUNT = 384
const REVIEW_COUNT = 1850
const LEAD_COUNT = 1180
const CHAT_COUNT = 760
const NOTIFICATION_COUNT = 420

let seed = 73591
const rand = () => {
  seed = (seed * 48271) % 2147483647
  return (seed - 1) / 2147483646
}
const pick = (items, offset = 0) => items[Math.floor((rand() * items.length + offset) % items.length)]
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const money = (value) => String(Math.round(value / 100) * 100)
const now = () => new Date().toISOString()
const daysAgo = (days) => new Date(Date.now() - days * 86400000 - int(0, 20) * 3600000)
const slugify = (value = '') => value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const titleCase = (value = '') => value.replace(/\b\w/g, (letter) => letter.toUpperCase())

const localities = [
  { name: 'Whitefield', lat: 12.9698, lng: 77.75, baseRent: 9800, metro: 'Whitefield Kadugodi Metro', parks: ['ITPL', 'EPIP Zone', 'Brigade Tech Park'], landmarks: ['Phoenix Marketcity', 'Forum Shantiniketan', 'Vydehi Hospital'] },
  { name: 'HSR Layout', lat: 12.9116, lng: 77.6474, baseRent: 11200, metro: 'Ragigudda Metro access', parks: ['HSR startup belt', 'RMZ Ecospace', 'Electronic City access'], landmarks: ['Sector 1 market', 'Agara Lake', 'BDA Complex'] },
  { name: 'Electronic City', lat: 12.8452, lng: 77.6602, baseRent: 7600, metro: 'Electronic City Metro corridor', parks: ['Infosys', 'Wipro', 'Tech Mahindra'], landmarks: ['Neeladri Road', 'Velankani Tech Park', 'Hosa Road'] },
  { name: 'Marathahalli', lat: 12.9569, lng: 77.7011, baseRent: 8700, metro: 'Kundalahalli Metro access', parks: ['Prestige Tech Park', 'Embassy TechVillage', 'Bagmane access'], landmarks: ['Marathahalli Bridge', 'Kalamandir', 'Multiplex junction'] },
  { name: 'Bellandur', lat: 12.9304, lng: 77.6784, baseRent: 11600, metro: 'Bellandur Road commute', parks: ['RMZ Ecospace', 'Embassy TechVillage', 'Cessna Business Park'], landmarks: ['Central Mall', 'Bellandur Lake', 'ORR service road'] },
  { name: 'Koramangala', lat: 12.9352, lng: 77.6245, baseRent: 12500, metro: 'MG Road metro by cab', parks: ['Koramangala startup belt', 'Embassy Golf Links', 'Ejipura offices'], landmarks: ['Forum Mall', 'Sony World signal', 'Jyoti Nivas College'] },
  { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, baseRent: 14200, metro: 'Indiranagar Metro', parks: ['Bagmane Tech Park', 'Embassy Golf Links', 'CBD offices'], landmarks: ['100 Feet Road', 'CMH Road', 'HAL 2nd Stage'] },
  { name: 'Hebbal', lat: 13.0358, lng: 77.597, baseRent: 9400, metro: 'Hebbal future metro', parks: ['Manyata Tech Park', 'Kirloskar Business Park', 'Nagavara offices'], landmarks: ['Hebbal Flyover', 'Esteem Mall', 'Nagavara Lake'] },
  { name: 'Yelahanka', lat: 13.1007, lng: 77.5963, baseRent: 7200, metro: 'Yelahanka rail and bus hub', parks: ['Airport corridor', 'Manyata access', 'Devanahalli offices'], landmarks: ['Yelahanka New Town', 'RMZ Galleria', 'Railway Station'] },
  { name: 'Sarjapur Road', lat: 12.9063, lng: 77.6938, baseRent: 9900, metro: 'Carmelaram rail access', parks: ['RGA Tech Park', 'Wipro SEZ', 'RMZ Ecoworld'], landmarks: ['Doddakannelli', 'Carmelaram', 'Kaikondrahalli Lake'] },
  { name: 'JP Nagar', lat: 12.9063, lng: 77.5857, baseRent: 9300, metro: 'JP Nagar Metro', parks: ['Bannerghatta Road offices', 'Jayanagar access', 'BTM access'], landmarks: ['Central Mall JP Nagar', 'Puttenahalli Lake', 'Brigade Millennium'] },
  { name: 'BTM Layout', lat: 12.9166, lng: 77.6101, baseRent: 8200, metro: 'Jayadeva Metro access', parks: ['Koramangala access', 'Electronic City access', 'Bannerghatta offices'], landmarks: ['BTM Water Tank', 'Udupi Garden', 'NS Palya'] },
  { name: 'KR Puram', lat: 13.0076, lng: 77.6959, baseRent: 8100, metro: 'KR Puram Metro', parks: ['Whitefield access', 'Bagmane World Technology Center', 'Mahadevapura offices'], landmarks: ['KR Puram Railway Station', 'Tin Factory', 'Phoenix Marketcity access'] },
  { name: 'Brookefield', lat: 12.9663, lng: 77.7185, baseRent: 10300, metro: 'Kundalahalli Metro', parks: ['Brookefield tech offices', 'ITPL access', 'EPIP Zone'], landmarks: ['Brookefield Mall', 'AECS Layout', 'Kundalahalli Gate'] },
  { name: 'Jayanagar', lat: 12.925, lng: 77.5938, baseRent: 10500, metro: 'Jayanagar Metro', parks: ['South End access', 'JP Nagar offices', 'CBD access'], landmarks: ['4th Block', 'Lalbagh access', 'National College'] },
  { name: 'Banashankari', lat: 12.9255, lng: 77.5468, baseRent: 7900, metro: 'Banashankari Metro', parks: ['JP Nagar access', 'Global Village commute', 'Jayanagar access'], landmarks: ['Banashankari BDA Complex', 'Kathriguppe', 'ISKCON Vaikuntha Hill'] },
]

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Kabir', 'Rohan', 'Rahul', 'Karthik', 'Nikhil', 'Siddharth', 'Vikram', 'Ritvik', 'Ananya', 'Aditi', 'Isha', 'Meera', 'Nandini', 'Priya', 'Sneha', 'Tanvi', 'Riya', 'Pooja', 'Divya', 'Anjali', 'Sanjana', 'Varun', 'Manish', 'Abhishek', 'Harsha', 'Tejas']
const lastNames = ['Sharma', 'Reddy', 'Nair', 'Patel', 'Iyer', 'Rao', 'Shetty', 'Menon', 'Kulkarni', 'Joshi', 'Verma', 'Agarwal', 'Gupta', 'Mishra', 'Naidu', 'Pillai', 'Bhat', 'Gowda', 'Khan', 'Das']
const occupations = ['Engineering student', 'MBA student', 'Software engineer', 'QA analyst', 'Product designer', 'Data analyst', 'Intern', 'Remote worker', 'Freelancer', 'IT employee', 'Cloud support engineer', 'Digital marketer']
const vendorTypes = ['PG owner', 'hostel operator', 'co-living operator', 'apartment manager']
const brandWords = ['Nest', 'Hive', 'Habitat', 'House', 'Residency', 'Living', 'Stays', 'Corner', 'Heights', 'Rooms', 'Urban', 'Campus', 'Metro', 'Prime', 'Elite', 'Comfort']
const propertyKinds = ['Boys PG', 'Girls PG', 'Co-living Space', 'Shared Flat', 'Studio Room', 'Premium PG', 'Budget PG', 'Student Stay', 'Working Professional Stay']
const propertyTypes = [
  ['PG', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80'],
  ['Hostel', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80'],
  ['Co-living', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80'],
  ['Flat', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80'],
  ['Studio', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80'],
  ['Premium PG', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80'],
  ['Budget PG', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'],
  ['Student Stay', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80'],
]
const imagePool = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80',
]
const amenities = ['High-speed WiFi', 'South Indian meals', 'North Indian meals', 'Laundry', 'CCTV', 'Biometric entry', 'Power backup', 'Housekeeping', 'RO water', 'Hot water', 'Study tables', 'Common lounge', 'Two-wheeler parking', 'Gym tie-up', 'Lift', 'Fridge', 'Kitchen access']
const reviewTopics = {
  5: ['Food is consistent and the rooms are cleaned on schedule.', 'Management responds quickly and the location is genuinely convenient.', 'WiFi was stable for work calls and the security setup feels reliable.'],
  4: ['Good overall stay; breakfast can be repetitive but the room maintenance is solid.', 'The property is worth the rent, especially because commute time is low.', 'Laundry pickup is regular and the owner is transparent about deposits.'],
  3: ['Decent for the price, though peak-time WiFi and washroom cleaning need attention.', 'Location is useful, but the room feels compact when all beds are occupied.', 'Food is average on weekdays and better on weekends.'],
  2: ['The property has potential, but maintenance requests took too long during my stay.', 'Good location, but noise and laundry delays made it hard to recommend fully.'],
  1: ['I had issues with cleanliness follow-up and deposit communication was not smooth.'],
}

const buildUser = (index, userType = 'User') => {
  const first = firstNames[index % firstNames.length]
  const last = lastNames[(index * 7) % lastNames.length]
  const gender = ['Male', 'Female', 'Other'][index % 17 === 0 ? 2 : index % 2]
  const locality = localities[index % localities.length]
  const emailPrefix = `${first}.${last}.${index}`.toLowerCase()
  return {
    userName: `${first} ${last}`,
    userFname: first,
    userLname: last,
    userEmail: `${emailPrefix}@${DEMO_EMAIL_DOMAIN}`,
    userPassword: hashPassword(userType === 'Vendor' ? 'Host1234' : 'User1234'),
    dob: `${int(1994, 2005)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
    gender,
    contact: `9${int(100000000, 999999999)}`,
    occupation: pick(occupations, index),
    bio: `${pick(occupations)} looking for verified stays around ${locality.name}, Bangalore.`,
    city: 'Bangalore',
    socialLinks: [],
    emailVerified: true,
    phoneVerified: index % 9 !== 0,
    accountStatus: 'active',
    termsAcceptedAt: daysAgo(int(15, 360)),
    privacyAcceptedAt: daysAgo(int(15, 360)),
    userType,
    verificationStatus: index % 12 === 0 ? 'Pending' : 'Verified',
    profile: `https://i.pravatar.cc/240?img=${(index % 70) + 1}`,
    preferences: {
      budget: [7000 + (index % 8) * 1500, 16000 + (index % 10) * 1000],
      preferredLocalities: [locality.name, localities[(index + 5) % localities.length].name],
      genderPreference: gender === 'Female' ? 'Girls' : index % 5 === 0 ? 'Co-ed' : 'Boys',
      foodRequired: index % 3 !== 0,
      moveInWindow: ['Immediately', 'Within 2 weeks', 'Next month'][index % 3],
    },
    addedOn: daysAgo(int(1, 420)).toISOString(),
    isActive: index % 37 !== 0,
  }
}

const buildVendor = (index) => {
  const base = buildUser(index + 500, 'Vendor')
  const locality = localities[index % localities.length]
  const businessName = `${pick(['Stay', 'Urban', 'Namma', 'Metro', 'Prime', 'Liv', 'Casa'], index)} ${pick(brandWords, index)} ${pick(['PG', 'CoLive', 'Hostels', 'Residences'], index)}`
  return {
    ...base,
    userEmail: `${slugify(businessName)}.${index}@${DEMO_EMAIL_DOMAIN}`,
    occupation: pick(vendorTypes, index),
    businessName,
    vendorType: pick(vendorTypes, index),
    vendorProfile: {
      foundedYear: int(2014, 2024),
      primaryLocality: locality.name,
      operatingLocalities: [locality.name, localities[(index + 3) % localities.length].name],
      rating: Number((4.1 + rand() * 0.8).toFixed(1)),
      responseTimeMinutes: int(8, 95),
      profileSummary: `${businessName} manages verified beds around ${locality.name} with documented deposits, periodic housekeeping, and lead follow-up through StayJi.`,
    },
    leadAnalytics: { inquiries: 0, visits: 0, conversions: 0, cancelled: 0, averageResponseMinutes: int(10, 110) },
    occupancyAnalytics: { totalBeds: 0, occupiedBeds: 0, vacancyRate: 0, averageRent: 0 },
    profile: `https://i.pravatar.cc/240?img=${((index + 14) % 70) + 1}`,
  }
}

const buildRoomInventory = (rent, premium, index) => {
  const single = { sharingType: 'Single sharing', totalRooms: int(2, 8), vacantRooms: int(0, 2), bedsPerRoom: 1, monthlyRent: money(rent + (premium ? 5200 : 3200)) }
  const double = { sharingType: 'Double sharing', totalRooms: int(4, 14), vacantRooms: int(0, 4), bedsPerRoom: 2, monthlyRent: money(rent + (premium ? 1800 : 600)) }
  const triple = { sharingType: 'Triple sharing', totalRooms: int(3, 12), vacantRooms: int(0, 4), bedsPerRoom: 3, monthlyRent: money(Math.max(5200, rent - 1700)) }
  const four = { sharingType: 'Four sharing', totalRooms: int(1, 8), vacantRooms: int(0, 3), bedsPerRoom: 4, monthlyRent: money(Math.max(4500, rent - 2600)) }
  return [single, double, triple, ...(index % 3 === 0 ? [four] : [])].map((room) => ({
    ...room,
    vacantBeds: room.vacantRooms * room.bedsPerRoom,
  }))
}

const buildProperty = (index, vendor, type) => {
  const locality = localities[index % localities.length]
  const kind = propertyKinds[index % propertyKinds.length]
  const premium = /Premium|Studio|Co-living/.test(kind) || locality.baseRent > 11500
  const rent = locality.baseRent + int(-1200, 2600) + (premium ? int(1800, 5200) : 0)
  const genderType = kind.includes('Girls') ? 'Girls' : kind.includes('Boys') ? 'Boys' : index % 5 === 0 ? 'Co-ed' : ['Boys', 'Girls', 'Co-ed'][index % 3]
  const category = kind.includes('Flat') ? 'Flat' : kind.includes('Studio') ? 'Studio' : kind.includes('Co-living') ? 'Co-living' : kind.includes('Student') ? 'Hostel' : 'PG'
  const inventory = buildRoomInventory(rent, premium, index)
  const availableBeds = inventory.reduce((sum, room) => sum + room.vacantBeds, 0)
  const totalBeds = inventory.reduce((sum, room) => sum + room.totalRooms * room.bedsPerRoom, 0)
  const imageStart = index % imagePool.length
  const selectedAmenities = amenities.filter((_, amenityIndex) => (amenityIndex + index) % 3 === 0).slice(0, int(8, 12))
  const propertyName = `${pick(['Namma', 'Blue', 'Olive', 'Cedar', 'Metro', 'Orchid', 'Ivy', 'Aura'], index)} ${locality.name} ${kind}`
  return {
    userIDFK: vendor._id,
    vendorId: vendor._id,
    propertyName,
    description: `${propertyName} is a ${premium ? 'premium managed' : 'verified budget-friendly'} ${category.toLowerCase()} in ${locality.name}, Bangalore. It is suited for ${genderType.toLowerCase()} tenants who want predictable rent, realistic food options, WiFi for work or study, CCTV coverage, and quick access to ${locality.parks[0]} and ${locality.landmarks[0]}. Rooms are listed with live vacancy counts, deposit clarity, sharing choices, and commute-aware landmark details.`,
    address: `${int(1, 14)}${['st', 'nd', 'rd', 'th'][index % 4]} Cross, ${pick(locality.landmarks)}, ${locality.name}, Bangalore`,
    rent: money(rent),
    sharing: ['Single', '2 Sharing', '3 Sharing', '4 Sharing'][index % 4],
    genderType,
    areaName: locality.name,
    localitySlug: slugify(locality.name),
    cityName: 'Bangalore',
    latitude: Number((locality.lat + (rand() - 0.5) * 0.035).toFixed(6)),
    longitude: Number((locality.lng + (rand() - 0.5) * 0.035).toFixed(6)),
    propertyTypeIDFK: type._id,
    aminityFeatures: selectedAmenities.join(', '),
    mealsAvailable: selectedAmenities.some((item) => /meal/i.test(item)) ? ['Breakfast', 'Dinner', index % 3 === 0 ? 'Lunch' : ''] .filter(Boolean) : [],
    propertyImage: `${imagePool[imageStart]}&sig=${index}`,
    propertyImageUrls: [0, 1, 2, 3, 4].map((offset) => `${imagePool[(imageStart + offset) % imagePool.length]}&sig=${index}-${offset}`),
    propertyCategory: category,
    pricingUnit: 'month',
    dailyRate: index % 11 === 0 ? money(Math.max(700, rent / 20)) : '',
    perDayCheckIn: index % 11 === 0,
    depositAmount: money(rent * (premium ? 1.5 : 1)),
    availableBeds,
    roomInventory: inventory,
    verificationChecklist: { identity: true, ownership: index % 13 !== 0, photos: true, location: true, pricing: true, safety: index % 9 !== 0 },
    vacancyStatus: availableBeds > 10 ? 'High availability' : availableBeds > 0 ? 'Limited beds available' : 'Fully occupied',
    availableFrom: daysAgo(-int(1, 35)).toISOString(),
    sharingAvailability: inventory.filter((room) => room.vacantBeds > 0).map((room) => room.sharingType).join(', ') || 'Waitlist open',
    parkingAvailable: selectedAmenities.includes('Two-wheeler parking'),
    acAvailable: premium && index % 2 === 0,
    securityFeatures: ['CCTV', 'Visitor log', 'Secure entry', index % 4 === 0 ? 'Women-only floor' : 'Night guard'].filter(Boolean),
    nearbyLandmarks: locality.landmarks,
    distanceFromITParks: Object.fromEntries(locality.parks.map((park) => [park, `${(1.2 + rand() * 7.5).toFixed(1)} km`])),
    distanceFromMetro: `${(0.7 + rand() * 5.8).toFixed(1)} km from ${locality.metro}`,
    occupancyDetails: {
      totalBeds,
      occupiedBeds: Math.max(0, totalBeds - availableBeds),
      vacancyCount: availableBeds,
      occupancyRate: totalBeds ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
    },
    rating: Number((3.7 + rand() * 1.25).toFixed(1)),
    reviewSummary: { food: 4.2, cleanliness: 4.3, wifi: 4.1, safety: 4.5, location: 4.4, management: 4.2 },
    recommendations: { similarProperties: [], nearbyStays: [], trendingInLocality: [], budgetAlternatives: [], premiumRecommendations: [] },
    isFeatured: premium || index % 7 === 0,
    boostScore: (premium ? 20 : 8) + int(0, 30),
    localityPriority: 1000 - index,
    approvalStatus: index % 31 === 0 ? 'Pending' : 'Approved',
    isAvailable: availableBeds > 0,
    addedOn: daysAgo(int(1, 210)).toISOString(),
    isActive: index % 43 !== 0,
  }
}

const ratingByDistribution = (index) => {
  const mod = index % 100
  if (mod < 45) return 5
  if (mod < 80) return 4
  if (mod < 95) return 3
  if (mod < 99) return 2
  return 1
}

const leadStatus = (index) => {
  const statuses = ['Interested', 'Inquiry Started', 'Callback Requested', 'Visit Requested', 'Visit Confirmed', 'Contact Shared', 'Moved In', 'Converted', 'Cancelled']
  return statuses[index % statuses.length]
}

async function removeOldDemoData() {
  const demoUsers = await User.find({ userEmail: new RegExp(`@${DEMO_EMAIL_DOMAIN.replace('.', '\\.')}$`) }).select('_id')
  const demoUserIds = demoUsers.map((user) => user._id)
  const demoProperties = await Property.find({ $or: [{ userIDFK: { $in: demoUserIds } }, { vendorId: { $in: demoUserIds } }] }).select('_id')
  const demoPropertyIds = demoProperties.map((property) => property._id)

  await Promise.all([
    PropertyImage.deleteMany({ propertyIDFK: { $in: demoPropertyIds } }),
    UserReview.deleteMany({ $or: [{ propertyIDFK: { $in: demoPropertyIds } }, { userIDFK: { $in: demoUserIds } }] }),
    Shortlist.deleteMany({ $or: [{ propertyIDFK: { $in: demoPropertyIds } }, { userIDFK: { $in: demoUserIds } }] }),
    Inquiry.deleteMany({ $or: [{ propertyIDFK: { $in: demoPropertyIds } }, { userIDFK: { $in: demoUserIds } }, { vendorId: { $in: demoUserIds } }] }),
    Visit.deleteMany({ $or: [{ propertyIDFK: { $in: demoPropertyIds } }, { userIDFK: { $in: demoUserIds } }, { vendorId: { $in: demoUserIds } }] }),
    Chat.deleteMany({ $or: [{ fromUserIDFK: { $in: demoUserIds } }, { toUserIDFK: { $in: demoUserIds } }] }),
    Notification.deleteMany({ $or: [{ recipientId: { $in: demoUserIds } }, { actorId: { $in: demoUserIds } }, { propertyId: { $in: demoPropertyIds } }] }),
    LeadEvent.deleteMany({ $or: [{ userId: { $in: demoUserIds } }, { vendorId: { $in: demoUserIds } }, { propertyId: { $in: demoPropertyIds } }] }),
    MoveInConfirmation.deleteMany({ $or: [{ userId: { $in: demoUserIds } }, { vendorId: { $in: demoUserIds } }, { propertyId: { $in: demoPropertyIds } }] }),
    Payment.deleteMany({ propertyIDFK: { $in: demoPropertyIds } }),
    AdminMessage.deleteMany({ $or: [{ vendorId: { $in: demoUserIds } }, { adminId: { $in: demoUserIds } }, { propertyId: { $in: demoPropertyIds } }] }),
    UserRequest.deleteMany({ $or: [{ propertyIDFK: { $in: demoPropertyIds } }, { userIDFK: { $in: demoUserIds } }] }),
  ])
  await Property.deleteMany({ _id: { $in: demoPropertyIds } })
  await User.deleteMany({ _id: { $in: demoUserIds } })
}

async function seedData() {
  await dbConnect
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise()
  }
  await removeOldDemoData()

  const admin = await User.create({
    userName: 'StayJi Demo Admin',
    userFname: 'StayJi',
    userLname: 'Admin',
    userEmail: `admin@${DEMO_EMAIL_DOMAIN}`,
    userPassword: hashPassword('Admin1234'),
    gender: 'Other',
    contact: '9000000001',
    occupation: 'Marketplace admin',
    city: 'Bangalore',
    userType: 'Admin',
    verificationStatus: 'Verified',
    profile: 'https://i.pravatar.cc/240?img=12',
    addedOn: now(),
    isActive: true,
  })

  const types = await Promise.all(propertyTypes.map(([typeName, image]) => PropertyType.findOneAndUpdate(
    { typeName },
    { $set: { typeName, image, addedOn: now(), isActive: true } },
    { upsert: true, new: true },
  )))
  await Promise.all(localities.map((locality) => Area.findOneAndUpdate(
    { cityName: 'Bangalore', areaName: locality.name },
    { $set: { cityName: 'Bangalore', areaName: locality.name, addedOn: now(), isActive: true } },
    { upsert: true, new: true },
  )))

  const users = await User.insertMany(Array.from({ length: USER_COUNT }, (_, index) => buildUser(index)))
  const vendors = await User.insertMany(Array.from({ length: VENDOR_COUNT }, (_, index) => buildVendor(index)))
  const propertyDocs = Array.from({ length: PROPERTY_COUNT }, (_, index) => buildProperty(index, vendors[index % vendors.length], types[index % types.length]))
  const properties = await Property.insertMany(propertyDocs)

  const gallery = properties.flatMap((property) => property.propertyImageUrls.map((image) => ({
    propertyIDFK: property._id,
    image,
    addedOn: property.addedOn,
    isActive: true,
  })))

  const reviews = Array.from({ length: REVIEW_COUNT }, (_, index) => {
    const property = properties[index % properties.length]
    const user = users[(index * 11) % users.length]
    const rating = ratingByDistribution(index)
    const tags = ['food', 'cleanliness', 'wifi', 'safety', 'location', 'management', 'occupancy'].filter((_, tagIndex) => (tagIndex + index) % 2 === 0).slice(0, 3)
    return {
      propertyIDFK: property._id,
      propertyId: property._id,
      userIDFK: user._id,
      userId: user._id,
      rating: String(rating),
      details: pick(reviewTopics[rating], index),
      tags,
      sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'mixed' : 'negative',
      reviewContext: {
        stayedFor: `${int(1, 10)} months`,
        roomType: property.sharing,
        locality: property.areaName,
        verifiedStay: index % 4 !== 0,
      },
      addedOn: daysAgo(int(1, 300)).toISOString(),
      isActive: true,
    }
  })

  const shortlists = Array.from({ length: 900 }, (_, index) => {
    const property = properties[(index * 5) % properties.length]
    const user = users[(index * 7) % users.length]
    return { propertyIDFK: property._id, propertyId: property._id, userIDFK: user._id, userId: user._id, addedOn: daysAgo(int(1, 160)).toISOString(), isActive: true }
  })

  const inquiries = []
  const visits = []
  const leadEvents = []
  const moveIns = []
  const payments = []
  for (let index = 0; index < LEAD_COUNT; index += 1) {
    const property = properties[(index * 13) % properties.length]
    const user = users[(index * 17) % users.length]
    const vendorId = property.vendorId || property.userIDFK
    const status = leadStatus(index)
    const converted = ['Moved In', 'Converted'].includes(status)
    const addedOn = daysAgo(int(1, 210))
    const sourceType = index % 2 === 0 ? 'inquiry' : 'visit'
    if (sourceType === 'inquiry') {
      inquiries.push({
        propertyIDFK: property._id,
        propertyId: property._id,
        vendorId,
        userIDFK: user._id,
        subject: pick(['Availability check', 'Food and deposit query', 'Visit request', 'Room sharing details'], index),
        description: `Interested in ${property.propertyName}. Need details for ${property.sharing} with move-in around ${pick(['this week', 'month end', 'next month'], index)}.`,
        preferredVisitTime: pick(['Weekday evening', 'Saturday morning', 'Sunday afternoon'], index),
        moveInPreference: pick(['Immediately', 'Within 2 weeks', 'Next month'], index),
        leadStage: converted ? 'converted' : status === 'Cancelled' ? 'cancelled' : 'qualified',
        isConverted: converted,
        reply: index % 4 === 0 ? 'Availability shared. Visit slot can be confirmed from dashboard.' : '',
        status: status !== 'Cancelled',
        addedOn: addedOn.toISOString(),
        isActive: true,
      })
    } else {
      visits.push({
        propertyIDFK: property._id,
        propertyId: property._id,
        vendorId,
        userIDFK: user._id,
        userId: user._id,
        visitDate: daysAgo(-int(1, 21)).toISOString().slice(0, 10),
        visitTime: pick(['10:30 AM', '12:00 PM', '4:30 PM', '6:00 PM'], index),
        moveInPreference: pick(['Immediately', 'Within 2 weeks', 'Next month'], index),
        leadStage: converted ? 'converted' : status === 'Cancelled' ? 'cancelled' : 'qualified',
        isConverted: converted,
        status,
        addedOn: addedOn.toISOString(),
        isActive: true,
      })
    }
    leadEvents.push({ userId: user._id, vendorId, propertyId: property._id, sourceType, status, note: `${status} via demo marketplace flow`, metadata: { locality: property.areaName, rent: property.rent }, addedOn, isActive: true })
    if (converted && moveIns.length < 150) {
      moveIns.push({ userId: user._id, vendorId, propertyId: property._id, ownerName: vendors.find((vendor) => vendor._id.equals(vendorId))?.userName || 'StayJi Partner', joiningDate: daysAgo(-int(1, 45)).toISOString().slice(0, 10), userNote: 'Move-in verified from demo seed workflow.', adminNote: 'Sample conversion for analytics.', status: index % 8 === 0 ? 'Pending' : 'Verified', commissionAmount: 2000, cashbackAmount: 250, duplicateRisk: index % 21 === 0, addedOn, verifiedOn: index % 8 === 0 ? null : daysAgo(int(1, 90)), isActive: true })
      payments.push({ paymentType: 'Vendor commission', propertyIDFK: property._id, date: addedOn.toISOString().slice(0, 10), amount: '2000', paymentPlan: 'Move-in success fee', addedOn: addedOn.toISOString(), isActive: true })
    }
  }

  const chats = Array.from({ length: CHAT_COUNT }, (_, index) => {
    const property = properties[(index * 19) % properties.length]
    const user = users[(index * 23) % users.length]
    const isAdminVendor = index % 9 === 0
    const from = isAdminVendor ? admin._id : index % 2 === 0 ? user._id : property.vendorId
    const to = isAdminVendor ? property.vendorId : index % 2 === 0 ? property.vendorId : user._id
    return {
      text: pick([
        'Is the listed rent inclusive of food and WiFi?',
        'Yes, rent includes WiFi and standard meals. Electricity is based on room type.',
        'Can I visit this weekend and check the double sharing room?',
        'Visit approved. Please carry an ID proof and call 20 minutes before arrival.',
        'Please update live vacancy count after today evening visits.',
        'The user asked about deposit refund and notice period.',
      ], index),
      fromUserIDFK: from,
      toUserIDFK: to,
      conversationType: isAdminVendor ? 'admin_vendor' : 'user_vendor',
      metadata: { propertyId: property._id, locality: property.areaName },
      addedOn: daysAgo(int(0, 120)).toISOString(),
      isActive: true,
    }
  })

  const notifications = Array.from({ length: NOTIFICATION_COUNT }, (_, index) => {
    const property = properties[(index * 29) % properties.length]
    const user = users[(index * 31) % users.length]
    const vendor = property.vendorId
    const recipientRole = index % 5 === 0 ? 'vendor' : index % 7 === 0 ? 'admin' : 'user'
    const recipientId = recipientRole === 'vendor' ? vendor : recipientRole === 'admin' ? admin._id : user._id
    const type = pick(['visit_approved', 'inquiry_received', 'cashback_processed', 'review_added', 'vendor_responded', 'lead_converted'], index)
    return {
      recipientId,
      recipientRole,
      actorId: recipientRole === 'user' ? vendor : user._id,
      propertyId: property._id,
      type,
      title: titleCase(type.replace(/_/g, ' ')),
      message: `${property.propertyName} has a ${type.replace(/_/g, ' ')} update in ${property.areaName}.`,
      link: recipientRole === 'vendor' ? `/dashboard/vendor/properties/${property._id}` : `/properties/${property._id}`,
      metadata: { locality: property.areaName, demo: true },
      addedOn: daysAgo(int(0, 90)),
      readAt: index % 3 === 0 ? daysAgo(int(0, 60)) : null,
      isActive: true,
    }
  })

  const complaints = Array.from({ length: 120 }, (_, index) => {
    const property = properties[(index * 37) % properties.length]
    const user = users[(index * 41) % users.length]
    return { propertyIDFK: property._id, sharing: property.sharing, noOfRooms: String(int(1, 2)), refrencebyname: user.userName, refrencecontact: user.contact, userIDFK: user._id, status: index % 5 !== 0, addedOn: daysAgo(int(1, 150)).toISOString(), isActive: true }
  })

  await Promise.all([
    PropertyImage.insertMany(gallery),
    UserReview.insertMany(reviews),
    Shortlist.insertMany(shortlists),
    Inquiry.insertMany(inquiries),
    Visit.insertMany(visits),
    LeadEvent.insertMany(leadEvents),
    MoveInConfirmation.insertMany(moveIns),
    Payment.insertMany(payments),
    Chat.insertMany(chats),
    Notification.insertMany(notifications),
    UserRequest.insertMany(complaints),
  ])

  const propertyIdsByLocality = properties.reduce((map, property) => {
    const key = property.areaName
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(property._id)
    return map
  }, new Map())

  await Promise.all(properties.map((property, index) => {
    const sameLocality = (propertyIdsByLocality.get(property.areaName) || []).filter((id) => !id.equals(property._id))
    const cheaper = properties.filter((item) => item.areaName === property.areaName && Number(item.rent) < Number(property.rent)).slice(0, 6).map((item) => item._id)
    const premium = properties.filter((item) => item.areaName === property.areaName && Number(item.rent) > Number(property.rent)).slice(0, 6).map((item) => item._id)
    return Property.updateOne({ _id: property._id }, {
      recommendations: {
        similarProperties: sameLocality.slice(index % 4, (index % 4) + 6),
        nearbyStays: sameLocality.slice(0, 8),
        trendingInLocality: sameLocality.slice(-8),
        studentsAlsoViewed: shortlists.filter((item) => item.propertyIDFK.equals(property._id)).slice(0, 8).map((item) => item.userIDFK),
        budgetAlternatives: cheaper,
        premiumRecommendations: premium,
      },
    })
  }))

  const vendorStats = new Map()
  properties.forEach((property) => {
    const key = property.vendorId.toString()
    if (!vendorStats.has(key)) vendorStats.set(key, { totalBeds: 0, occupiedBeds: 0, rents: [], propertyHistory: [] })
    const row = vendorStats.get(key)
    row.totalBeds += property.occupancyDetails.totalBeds
    row.occupiedBeds += property.occupancyDetails.occupiedBeds
    row.rents.push(Number(property.rent))
    row.propertyHistory.push({ propertyId: property._id, name: property.propertyName, locality: property.areaName, status: property.approvalStatus })
  })
  await Promise.all(vendors.map((vendor) => {
    const row = vendorStats.get(vendor._id.toString()) || { totalBeds: 0, occupiedBeds: 0, rents: [], propertyHistory: [] }
    const vendorInquiries = inquiries.filter((lead) => lead.vendorId.equals(vendor._id))
    const vendorVisits = visits.filter((lead) => lead.vendorId.equals(vendor._id))
    const conversions = [...vendorInquiries, ...vendorVisits].filter((lead) => lead.isConverted).length
    return User.updateOne({ _id: vendor._id }, {
      leadAnalytics: { inquiries: vendorInquiries.length, visits: vendorVisits.length, conversions, cancelled: [...vendorInquiries, ...vendorVisits].filter((lead) => lead.leadStage === 'cancelled').length, averageResponseMinutes: int(10, 95) },
      occupancyAnalytics: { totalBeds: row.totalBeds, occupiedBeds: row.occupiedBeds, vacancyRate: row.totalBeds ? Math.round(((row.totalBeds - row.occupiedBeds) / row.totalBeds) * 100) : 0, averageRent: row.rents.length ? Math.round(row.rents.reduce((sum, value) => sum + value, 0) / row.rents.length) : 0 },
      propertyHistory: row.propertyHistory,
    })
  }))

  await Promise.all(users.map((user, index) => {
    const viewed = properties.slice(index % properties.length, (index % properties.length) + 8)
    const wished = shortlists.filter((item) => item.userIDFK.equals(user._id)).slice(0, 10)
    const userInquiries = inquiries.filter((item) => item.userIDFK.equals(user._id)).slice(0, 8)
    return User.updateOne({ _id: user._id }, {
      viewedProperties: viewed.map((property) => ({ propertyId: property._id, name: property.propertyName, locality: property.areaName, viewedAt: daysAgo(int(1, 90)).toISOString() })),
      wishlistHistory: wished.map((item) => ({ propertyId: item.propertyIDFK, savedAt: item.addedOn })),
      savedSearches: user.preferences.preferredLocalities.map((locality) => ({ locality, budget: user.preferences.budget, foodRequired: user.preferences.foodRequired, createdAt: daysAgo(int(1, 120)).toISOString() })),
      inquiryHistory: userInquiries.map((item) => ({ inquiryId: item._id, propertyId: item.propertyIDFK, status: item.leadStage, addedOn: item.addedOn })),
    })
  }))

  console.log(`Seeded ${users.length} users, ${vendors.length} vendors, ${properties.length} properties.`)
  console.log(`Added ${gallery.length} images, ${reviews.length} reviews, ${LEAD_COUNT} lead records, ${chats.length} chats, ${notifications.length} notifications.`)
  await mongoose.connection.close()
  process.exit(0)
}

seedData().catch(async (error) => {
  console.error('Seed failed:', error)
  await mongoose.connection.close()
  process.exit(1)
})
