import axiosClient, { baseURL } from './axiosClient'

const toAssetUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const clean = value.toString().replace(/^\/+/, '')
  if (clean.startsWith('upload/')) return `${baseURL}/${clean}`
  if (clean.startsWith('public/upload/')) return `${baseURL}/${clean.replace(/^public\//, '')}`
  return `${baseURL}/upload/${clean}`
}

const toUploadUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const clean = value.toString().replace(/^\/+/, '')
  if (clean.startsWith('upload/')) return `${baseURL}/${clean}`
  return `${baseURL}/upload/${clean}`
}

const normalizeProperty = (property) => {
  if (!property) return property

  const amenities = property.aminityFeatures
    ? property.aminityFeatures.split(',').map((item) => item.trim()).filter(Boolean)
    : property.amenities || []
  const customFeatures = Array.isArray(property.customFeatures) ? property.customFeatures : []
  const mealsAvailable = Array.isArray(property.mealsAvailable) ? property.mealsAvailable : []

  const cityName = (property.cityName || property.city || '').toString()
  const inferredCategory = property.propertyCategory || property.category || property.propertyTypeIDFK?.typeName || property.type || 'PG'
  const categoryFallbackImages = {
    PG: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
    Hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    Flat: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80',
    Hostel: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80',
  }
  const fallbackImage = categoryFallbackImages[inferredCategory] || categoryFallbackImages.PG
  const imageUrls = [
    ...(Array.isArray(property.propertyImageUrls) ? property.propertyImageUrls : []),
    property.propertyImage,
    property.image,
  ].filter(Boolean).map(toAssetUrl)
  const coordinates = {
    mumbai: { lat: 19.076, lng: 72.8777 },
    bangalore: { lat: 12.9716, lng: 77.5946 },
    pune: { lat: 18.5204, lng: 73.8567 },
    delhi: { lat: 28.7041, lng: 77.1025 },
    hyderabad: { lat: 17.385, lng: 78.4867 },
    chennai: { lat: 13.0827, lng: 80.2707 },
    kolkata: { lat: 22.5726, lng: 88.3639 },
    jaipur: { lat: 26.9124, lng: 75.7873 },
  }

  const explicitLocation = {
    lat: Number(property.latitude ?? property.location?.lat),
    lng: Number(property.longitude ?? property.location?.lng),
  }
  const normalizedLocation = Number.isFinite(explicitLocation.lat) && Number.isFinite(explicitLocation.lng)
    ? explicitLocation
    : coordinates[cityName.toLowerCase()] || null

  return {
    ...property,
    id: property._id || property.id,
    name: property.propertyName || property.name,
    description: property.description || property.summary,
    ownerId: property.userIDFK?._id || property.userIDFK || property.ownerId || '',
    address: property.address || '',
    latitude: property.latitude,
    longitude: property.longitude,
    location: normalizedLocation,
    locationLabel: property.address || property.areaName || property.city || '',
    city: property.cityName || property.city || '',
    area: property.areaName || property.area || '',
    localitySlug: property.localitySlug || '',
    contact: property.contact || property.userIDFK?.contact || '',
    ownerName: [property.userIDFK?.userFname, property.userIDFK?.userLname].filter(Boolean).join(' '),
    type: inferredCategory,
    propertyTypeName: property.propertyTypeIDFK?.typeName || property.type || '',
    category: inferredCategory,
    rent: Number(property.rent) || property.rent || 0,
    dailyRate: Number(property.dailyRate) || property.dailyRate || 0,
    pricingUnit: property.pricingUnit || 'month',
    perDayCheckIn: Boolean(property.perDayCheckIn),
    depositAmount: Number(property.depositAmount) || property.depositAmount || 0,
    availableBeds: Number(property.availableBeds) || 0,
    roomInventory: Array.isArray(property.roomInventory) ? property.roomInventory : [],
    vacancyStatus: property.vacancyStatus || (property.isAvailable === false ? 'Fully occupied' : 'Available now'),
    availableFrom: property.availableFrom || '',
    sharingAvailability: property.sharingAvailability || property.sharing || '',
    parkingAvailable: Boolean(property.parkingAvailable) || amenities.some((item) => /parking/i.test(item)),
    acAvailable: Boolean(property.acAvailable) || amenities.some((item) => /ac|air conditioning/i.test(item)),
    sharing: property.sharing || property.roomType || '',
    gender: property.genderType || property.gender || 'Co-ed',
    foodIncluded: mealsAvailable.length > 0 || amenities.some((item) => /meal|food/i.test(item)),
    mealsAvailable,
    menuPhoto: toAssetUrl(property.menuPhoto || property.menuPhotoUrls?.[0] || ''),
    menuPhotoUrls: (property.menuPhotoUrls || []).map(toAssetUrl),
    image: imageUrls[0] || fallbackImage,
    images: imageUrls.length ? [...new Set(imageUrls)] : [fallbackImage],
    videoUrl: toUploadUrl(property.videoUrl || ''),
    status: property.isAvailable === false ? 'Booked' : 'Available',
    approvalStatus: property.approvalStatus || 'Approved',
    rating: Number(property.rating) || property.rating || 4.6,
    amenities,
    customFeatures,
    displayBadges: [
      property.isDummy ? 'Demo Property' : '',
      property.status === 'demo' ? 'Sample Listing' : '',
      property.isDummy && property.isActive !== false ? 'Coming Soon Area' : '',
    ].filter(Boolean),
    isDummy: Boolean(property.isDummy),
  }
}

const mapResponse = (response) => {
  if (!response) return response
  if (Array.isArray(response)) return response.map(normalizeProperty)
  return normalizeProperty(response)
}

const normalizeShortlistItem = (item) => {
  const property = item.propertyIDFK || item.property || item
  return {
    ...item,
    id: item._id || item.id,
    property: normalizeProperty(property),
  }
}

const propertyApi = {
  // Return full property list from backend
  list: (params) => axiosClient.get('/client/getPropertyList', { params }).then((res) => mapResponse(res.data && res.data.data)),

  // Backend expects POST with { id }
  detail: (id, options = {}) => axiosClient.post('/client/getPropertyById', { id, includePrivate: Boolean(options.includePrivate) }).then((res) => mapResponse(res.data && res.data.data)),

  // Popular: backend has no featured endpoint; reuse property list and let caller slice
  popular: () => axiosClient.get('/client/getPropertyList').then((res) => mapResponse(res.data && res.data.data)),
  all: (params) => axiosClient.get('/client/getAllPropertyList', { params }).then((res) => mapResponse(res.data && res.data.data)),
  review: ({ id, approvalStatus }) => axiosClient.post('/client/reviewProperty', { id, approvalStatus }).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'Property review was not updated')
    }
    return normalizeProperty(res.data?.data)
  }),
  propertyTypes: () => axiosClient.get('/client/getPropertyType').then((res) => res.data?.data || []),

  // Try city/area lookups if provided, otherwise return full list
  nearby: (coords) => {
    if (!coords) return axiosClient.get('/client/getPropertyList').then((res) => mapResponse(res.data && res.data.data))
    if (coords.cityName) return axiosClient.post('/client/getPropertyByCity', { cityName: coords.cityName }).then((res) => mapResponse(res.data && res.data.data))
    if (coords.areaName) return axiosClient.post('/client/getPropertyByArea', { areaName: coords.areaName }).then((res) => mapResponse(res.data && res.data.data))
    return axiosClient.get('/client/getPropertyList').then((res) => mapResponse(res.data && res.data.data))
  },

  // Shortlist expects userIDFK and propertyIDFK
  shortlist: ({ userIDFK, propertyIDFK }) => axiosClient.post('/client/addShortlist', { userIDFK, propertyIDFK }).then((res) => res.data && res.data.data),
  removeShortlist: ({ userIDFK, propertyIDFK }) => axiosClient.post('/client/deleteShortlist', { userIDFK, propertyIDFK }).then((res) => res.data && res.data.data),

  shortlistByUser: (userIDFK) => axiosClient.post('/client/getShortlistById', { userIDFK }).then((res) => (res.data?.data || []).map(normalizeShortlistItem)),

  // Book visit uses /addVisit (expects userIDFK, propertyIDFK, visitDate)
  bookVisit: ({ userIDFK, propertyIDFK, visitDate, visitTime, moveInPreference }) => axiosClient.post('/client/addVisit', { userIDFK, propertyIDFK, visitDate, visitTime, moveInPreference }).then((res) => res.data && res.data.data),
  expressInterest: ({ userIDFK, propertyIDFK, subject, description, preferredVisitTime, moveInPreference }) => axiosClient.post('/client/addInterest', { userIDFK, propertyIDFK, subject, description, preferredVisitTime, moveInPreference }).then((res) => res.data && res.data.data),
  submitMoveIn: (payload) => axiosClient.post('/client/moveIns', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Move-in could not be submitted')
    return res.data?.data
  }),

  create: (payload) => axiosClient.post('/client/addProperty', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'Property was not created')
    }
    return res.data?.data
  }),

  update: (id, payload) => axiosClient.post('/client/updateProperty', { id, ...payload }).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'Property was not updated')
    }
    return res.data?.data
  }),

  remove: (id) => axiosClient.post('/client/deleteProperty', { id }).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'Property was not deleted')
    }
    return res.data?.data
  }),
  reactivate: (id) => axiosClient.post('/client/reactivateProperty', { id }).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'Property was not reactivated')
    }
    return normalizeProperty(res.data?.data)
  }),
}

export default propertyApi
