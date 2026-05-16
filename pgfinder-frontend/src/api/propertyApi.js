import axiosClient from './axiosClient'

const normalizeProperty = (property) => {
  if (!property) return property

  const amenities = property.aminityFeatures
    ? property.aminityFeatures.split(',').map((item) => item.trim()).filter(Boolean)
    : property.amenities || []

  const cityName = (property.cityName || property.city || '').toString()
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

  return {
    ...property,
    id: property._id || property.id,
    name: property.propertyName || property.name,
    description: property.description || property.summary,
    address: property.address || property.location || '',
    location: typeof property.location === 'object' ? property.location : coordinates[cityName.toLowerCase()] || null,
    locationLabel: property.address || property.location || property.city || '',
    city: property.cityName || property.city || '',
    type: property.propertyTypeIDFK?.typeName || property.type || 'PG / Hostel',
    rent: Number(property.rent) || property.rent || 0,
    sharing: property.sharing || property.roomType || '',
    gender: property.genderType || property.gender || 'Co-ed',
    foodIncluded: amenities.some((item) => /meal|food/i.test(item)),
    image: property.propertyImage || property.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
    status: property.isAvailable === false ? 'Booked' : 'Available',
    amenities,
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
  detail: (id) => axiosClient.post('/client/getPropertyById', { id }).then((res) => mapResponse(res.data && res.data.data)),

  // Popular: backend has no featured endpoint; reuse property list and let caller slice
  popular: () => axiosClient.get('/client/getPropertyList').then((res) => mapResponse(res.data && res.data.data)),

  // Try city/area lookups if provided, otherwise return full list
  nearby: (coords) => {
    if (!coords) return axiosClient.get('/client/getPropertyList').then((res) => mapResponse(res.data && res.data.data))
    if (coords.cityName) return axiosClient.post('/client/getPropertyByCity', { cityName: coords.cityName }).then((res) => mapResponse(res.data && res.data.data))
    if (coords.areaName) return axiosClient.post('/client/getPropertyByArea', { areaName: coords.areaName }).then((res) => mapResponse(res.data && res.data.data))
    return axiosClient.get('/client/getPropertyList').then((res) => mapResponse(res.data && res.data.data))
  },

  // Shortlist expects userIDFK and propertyIDFK
  shortlist: ({ userIDFK, propertyIDFK }) => axiosClient.post('/client/addShortlist', { userIDFK, propertyIDFK }).then((res) => res.data && res.data.data),

  shortlistByUser: (userIDFK) => axiosClient.post('/client/getShortlistById', { userIDFK }).then((res) => (res.data?.data || []).map(normalizeShortlistItem)),

  // Book visit uses /addVisit (expects userIDFK, propertyIDFK, visitDate)
  bookVisit: ({ userIDFK, propertyIDFK, visitDate }) => axiosClient.post('/client/addVisit', { userIDFK, propertyIDFK, visitDate }).then((res) => res.data && res.data.data),

  create: (payload) => axiosClient.post('/client/addProperty', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'Property was not created')
    }
    return res.data?.data
  }),
}

export default propertyApi
