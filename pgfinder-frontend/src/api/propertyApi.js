import axiosClient, { baseURL } from './axiosClient'
import { MVP_CITY } from '../config/mvp'
import { demoProperties, getDemoPropertyById, isStaticDemoPropertyId } from '../data/demoProperties'
import { isDemoPropertyMode } from '../config/demoPropertyMode'

export const toAssetUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const clean = value.toString().replace(/^\/+/, '').replace(/\\/g, '/')
  if (clean.startsWith('upload/')) return `${baseURL}/${clean}`
  if (clean.startsWith('public/upload/')) return `${baseURL}/${clean.replace(/^public\//, '')}`
  return `${baseURL}/upload/${clean}`
}

const toUploadUrl = (value) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  const clean = value.toString().replace(/^\/+/, '').replace(/\\/g, '/')
  if (clean.startsWith('upload/')) return `${baseURL}/${clean}`
  if (clean.startsWith('public/upload/')) return `${baseURL}/${clean.replace(/^public\//, '')}`
  return `${baseURL}/upload/${clean}`
}

export const parseAssetList = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap(parseAssetList)
  if (typeof value === 'object' && value !== null) {
    return parseAssetList(value.image || value.url || '')
  }
  const source = value.toString()
  return source
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeRoomInventory = (property) => {
  const directInventory = Array.isArray(property.roomInventory) ? property.roomInventory : []
  if (directInventory.length) {
    return directInventory.map((row) => ({
      sharingType: row.sharingType || row.label || '',
      totalRooms: Number(row.totalRooms) || 0,
      occupiedRooms: Number(row.occupiedRooms) || 0,
      vacantRooms: Number(row.vacantRooms) || 0,
      bedsPerRoom: Number(row.bedsPerRoom) || 1,
      vacantBeds: Number(row.vacantBeds || row.availableBeds || 0) || 0,
      waitingList: Number(row.waitingList) || 0,
      bathroom: row.bathroom || '',
      balcony: Boolean(row.balcony),
      ac: Boolean(row.ac),
      furnishing: row.furnishing || '',
      foodPreference: row.foodPreference || '',
      gender: row.gender || '',
      monthlyRent: row.monthlyRent || '',
    })).filter((row) => row.sharingType)
  }

  if (!Array.isArray(property.roomTypes)) return []
  return property.roomTypes.map((row) => ({
    sharingType: row.sharingType || row.label || '',
    totalRooms: Number(row.totalRooms) || 0,
    occupiedRooms: Number(row.occupiedRooms) || 0,
    vacantRooms: Number(row.vacantRooms) || 0,
    bedsPerRoom: Number(row.bedsPerRoom) || 1,
    vacantBeds: Number(row.vacantBeds || row.availableBeds || 0) || 0,
    waitingList: Number(row.waitingList) || 0,
    bathroom: row.bathroom || '',
    balcony: Boolean(row.balcony),
    ac: Boolean(row.ac),
    furnishing: row.furnishing || '',
    foodPreference: row.foodPreference || '',
    gender: row.gender || '',
    monthlyRent: row.monthlyRent || '',
  })).filter((row) => row.sharingType)
}

const buildSharingSummary = (roomInventory, fallback = '') => {
  if (!roomInventory?.length) return fallback
  const summary = roomInventory
    .filter((row) => row.sharingType)
    .map((row) => {
      const rentSuffix = row.monthlyRent ? ` · ₹${row.monthlyRent}` : ''
      const vacancySuffix = row.vacantBeds || row.vacantRooms ? ` · ${row.vacantBeds || row.vacantRooms} vacant` : ''
      return `${row.sharingType}${rentSuffix}${vacancySuffix}`
    })
  return summary.join(' · ')
}

export const normalizeProperty = (property) => {
  if (!property) return property

  const amenities = property.aminityFeatures
    ? property.aminityFeatures.split(',').map((item) => item.trim()).filter(Boolean)
    : property.amenities || []
  const customFeatures = Array.isArray(property.customFeatures) ? property.customFeatures : []
  const mealsAvailable = Array.isArray(property.mealsAvailable) ? property.mealsAvailable : []
  const premiumExpired = property.premiumEndDate && new Date(property.premiumEndDate).getTime() < Date.now()
  const isPremium = Boolean(property.isPremium) && !premiumExpired
  const roomInventory = normalizeRoomInventory(property)
  const sharingSummary = buildSharingSummary(roomInventory, property.sharingAvailability || property.sharing || '')

  const cityName = (property.cityName || property.city || '').toString()
  const stateName = (property.stateName || property.state || '').toString()
  const inferredCategory = property.propertyCategory || property.category || property.propertyTypeIDFK?.typeName || property.type || 'PG'
  const categoryFallbackImages = {
    PG: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
    Hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    Flat: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80',
    Hostel: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80',
  }
  const fallbackImage = categoryFallbackImages[inferredCategory] || categoryFallbackImages.PG
  const imageUrls = [
    ...parseAssetList(property.propertyImageUrls),
    ...parseAssetList(property.images),
    property.propertyImage,
    property.image,
  ].filter(Boolean).map(toAssetUrl)
  const coordinates = {
    bangalore: { lat: 12.9716, lng: 77.5946 },
    bengaluru: { lat: 12.9716, lng: 77.5946 },
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
    ownerId: property.vendorId?._id || property.vendorId || property.userIDFK?._id || property.userIDFK || property.ownerId || '',
    address: property.address || '',
    latitude: property.latitude,
    longitude: property.longitude,
    location: normalizedLocation,
    locationLabel: property.address || property.areaName || property.city || '',
    city: property.cityName || property.city || '',
    state: stateName,
    stateName,
    area: property.areaName || property.area || '',
    localitySlug: property.localitySlug || '',
    contact: property.contact || property.userIDFK?.contact || '',
    ownerName: property.owner?.name || [property.vendorId?.userFname || property.userIDFK?.userFname, property.vendorId?.userLname || property.userIDFK?.userLname].filter(Boolean).join(' '),
    type: inferredCategory,
    propertyType: property.propertyType || inferredCategory,
    propertyTypeName: property.propertyTypeIDFK?.typeName || property.type || '',
    category: inferredCategory,
    rent: Number(property.rent) || property.rent || 0,
    dailyRate: Number(property.dailyRate) || property.dailyRate || 0,
    pricingUnit: property.pricingUnit || 'month',
    perDayCheckIn: Boolean(property.perDayCheckIn),
    depositAmount: Number(property.depositAmount) || property.depositAmount || 0,
    availableBeds: Number(property.availableBeds) || 0,
    roomInventory,
    vacancyStatus: property.vacancyStatus || (property.isAvailable === false ? 'Fully occupied' : 'Available now'),
    availableFrom: property.availableFrom || '',
    sharingAvailability: sharingSummary,
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
    isPremium,
    premiumStartDate: property.premiumStartDate,
    premiumEndDate: property.premiumEndDate,
    priority: Number(property.priority) || 0,
    isVerified: Boolean(property.isVerified) || ['Approved', 'Verified'].includes(property.approvalStatus || ''),
    rating: Number(property.rating) || property.rating || 4.6,
    amenities,
    customFeatures,
    displayBadges: [
      property.isDummy ? 'Demo Property' : '',
      property.status === 'demo' ? 'Sample Listing' : '',
      property.isDummy && property.isActive !== false && !property.isStaticDemo ? 'Coming Soon Area' : '',
      isPremium ? 'Premium' : '',
      property.isVerified ? 'Verified' : '',
    ].filter(Boolean),
    isDummy: Boolean(property.isDummy),
  }
}

// Listing cards already contain the public fields needed by the detail and
// comparison views. Keep a per-tab copy so a briefly unavailable detail API
// cannot turn a listing the user just selected into an "unavailable" page.
// This deliberately uses sessionStorage (not the owner/private API response)
// and is only a fallback; the API remains the source of truth.
const propertyPreviewCache = new Map()
const propertyPreviewStorageKey = (id) => `stayji-public-property-preview:${id}`

const cachePublicProperty = (property) => {
  const normalized = normalizeProperty(property)
  const id = normalized?.id || normalized?._id
  if (!id) return normalized

  propertyPreviewCache.set(String(id), normalized)
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(propertyPreviewStorageKey(id), JSON.stringify(normalized))
    } catch {
      // Storage can be disabled or full; the in-memory fallback still works.
    }
  }
  return normalized
}

const getCachedPublicProperty = (id) => {
  if (!id) return null
  const key = String(id)
  const inMemory = propertyPreviewCache.get(key)
  if (inMemory) return inMemory
  if (typeof window === 'undefined') return null

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(propertyPreviewStorageKey(key)) || 'null')
    if (!stored) return null
    const property = normalizeProperty(stored)
    propertyPreviewCache.set(key, property)
    return property
  } catch {
    return null
  }
}

const mapResponse = (response) => {
  if (!response) return response
  if (Array.isArray(response)) return response.map(normalizeProperty)
  return normalizeProperty(response)
}

const mapPublicResponse = (response) => {
  if (!response) return response
  if (Array.isArray(response)) return response.map(cachePublicProperty)
  return cachePublicProperty(response)
}

const contains = (value, query) => String(value || '').toLowerCase().includes(String(query || '').trim().toLowerCase())
const isEnabled = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase())

const filterDemoProperties = (params = {}) => {
  const search = String(params.search || params.q || '').trim()
  const area = String(params.area || params.areaName || params.locality || '').trim()
  const categories = String(params.categories || params.category || '').split(',').map((item) => item.trim()).filter(Boolean)
  const genders = String(params.gender || '').split(',').map((item) => item.trim()).filter(Boolean)
  const sharingTypes = String(params.sharingType || params.sharing || '').split(',').map((item) => item.trim()).filter(Boolean)
  const amenities = String(params.amenities || '').split(',').map((item) => item.trim()).filter(Boolean)
  const minimumRent = Number(params.minPrice || params.minBudget) || 0
  const maximumRent = Number(params.maxPrice || params.maxBudget) || Infinity

  return demoProperties.filter((property) => {
    const haystack = [
      property.name,
      property.description,
      property.area,
      property.city,
      property.category,
      property.gender,
      property.sharing,
      ...(property.amenities || []),
    ].join(' ').toLowerCase()
    if (search && !search.toLowerCase().split(/\s+/).every((token) => haystack.includes(token))) return false
    if (area && !contains(property.area, area)) return false
    if (categories.length && !categories.some((category) => contains(property.category, category))) return false
    if (genders.length && !genders.some((gender) => contains(property.gender, gender))) return false
    if (sharingTypes.length && !sharingTypes.some((sharing) => contains(property.sharing, sharing))) return false
    if (Number(property.rent) < minimumRent || Number(property.rent) > maximumRent) return false
    if (isEnabled(params.foodIncluded || params.food) && !property.foodIncluded) return false
    if (isEnabled(params.ac) && !property.acAvailable) return false
    if (isEnabled(params.parking) && !property.parkingAvailable) return false
    if (isEnabled(params.attachedBathroom) && !property.amenities.some((amenity) => /attached bathroom/i.test(amenity))) return false
    if (isEnabled(params.availableNow) && (!property.isAvailable || property.availableBeds <= 0)) return false
    if (params.rating && Number(property.rating) < Number(params.rating)) return false
    if (amenities.length && !amenities.every((amenity) => property.amenities.some((item) => contains(item, amenity)))) return false
    return true
  })
}

const getDemoPropertyPage = (params = {}) => {
  const items = filterDemoProperties(params)
  const requestedLimit = Number(params.limit) || 24
  const limit = Math.min(100, Math.max(1, requestedLimit))
  const page = Math.max(1, Number(params.page) || 1)
  const start = (page - 1) * limit
  return {
    items: mapPublicResponse(items.slice(start, start + limit)),
    meta: {
      page,
      limit,
      total: items.length,
      pages: Math.max(1, Math.ceil(items.length / limit)),
      demo: true,
      source: 'static-demo',
    },
  }
}

const demoShortlistStorageKey = (userIDFK) => `stayji-demo-shortlist:${userIDFK || 'anonymous'}`

const readDemoShortlistIds = (userIDFK) => {
  if (typeof window === 'undefined') return []
  try {
    const value = JSON.parse(window.localStorage.getItem(demoShortlistStorageKey(userIDFK)) || '[]')
    return Array.isArray(value) ? value.filter(isStaticDemoPropertyId) : []
  } catch {
    return []
  }
}

const writeDemoShortlistIds = (userIDFK, ids) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(demoShortlistStorageKey(userIDFK), JSON.stringify([...new Set(ids.filter(isStaticDemoPropertyId))]))
}

const demoShortlistItems = (userIDFK) => readDemoShortlistIds(userIDFK)
  .map(getDemoPropertyById)
  .filter(Boolean)
  .map((property) => ({
    id: `demo-shortlist-${property.id}`,
    propertyIDFK: property.id,
    property: normalizeProperty(property),
  }))

const normalizeShortlistItem = (item) => {
  const property = item.propertyIDFK || item.property || item
  return {
    ...item,
    id: item._id || item.id,
    property: normalizeProperty(property),
  }
}

const fetchPropertyPage = (params) => axiosClient.get('/client/getPropertyList', { params }).then((res) => ({
  items: mapPublicResponse(res.data && res.data.data) || [],
  meta: res.data?.meta || {},
}))

const fetchRemainingPropertyPages = async (requestParams, totalPages) => {
  const pages = []
  const batchSize = 4
  for (let page = 2; page <= totalPages; page += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, totalPages - page + 1) },
      (_, index) => fetchPropertyPage({ ...requestParams, limit: 100, page: page + index }),
    )
    pages.push(...await Promise.all(batch))
  }
  return pages
}

let featuredPropertiesPromise = null
let featuredPropertiesCache = null

const propertyApi = {
  page: async (params = {}) => {
    if (isDemoPropertyMode(params)) return getDemoPropertyPage(params)
    const { fallbackToDemo, ...requestParams } = params
    delete requestParams.demo
    const scopedParams = { ...requestParams, cityName: MVP_CITY }
    try {
      return await fetchPropertyPage({
        ...scopedParams,
        page: scopedParams.page || 1,
      })
    } catch (error) {
      if (fallbackToDemo) return getDemoPropertyPage(params)
      throw error
    }
  },

  // Return full property list from backend
  list: async (params = {}) => {
    const { allPages, ...requestParams } = params || {}
    if (isDemoPropertyMode(requestParams)) {
      const page = getDemoPropertyPage({ ...requestParams, limit: allPages ? 100 : requestParams.limit })
      return page.items
    }
    const scopedParams = { ...requestParams, cityName: MVP_CITY }
    const firstPage = await fetchPropertyPage({
      ...scopedParams,
      ...(allPages ? { limit: 100 } : {}),
      page: scopedParams.page || 1,
    })
    if (!allPages) return firstPage.items

    const totalPages = Number(firstPage.meta.pages || 1)
    if (totalPages <= 1) return firstPage.items

    const remainingPages = await fetchRemainingPropertyPages(scopedParams, totalPages)
    return [...firstPage.items, ...remainingPages.flatMap((page) => page.items)]
  },

  // Backend expects POST with { id }. Static demo IDs are resolved locally and
  // cannot expose or depend on production owner records.
  detail: (id, options = {}) => {
    const demoProperty = getDemoPropertyById(id)
    if (demoProperty) return Promise.resolve(normalizeProperty(demoProperty))
    const cachedProperty = options.includePrivate ? null : getCachedPublicProperty(id)
    return axiosClient.post('/client/getPropertyById', { id, includePrivate: Boolean(options.includePrivate) })
      .then((res) => {
        const property = mapResponse(res.data && res.data.data)
        return property?.id || property?._id ? property : cachedProperty || property
      })
      .catch((error) => {
        if (cachedProperty) return cachedProperty
        throw error
      })
  },

  featured: (limit = 6) => {
    if (isDemoPropertyMode()) return Promise.resolve(mapResponse(demoProperties.slice(0, Math.max(1, Number(limit) || 6))))
    const cacheKey = Number(limit) || 6
    if (featuredPropertiesCache?.limit === cacheKey) return Promise.resolve(featuredPropertiesCache.items)
    if (featuredPropertiesPromise?.limit === cacheKey) return featuredPropertiesPromise.promise
    // Use the lightweight endpoint first. The legacy request remains a
    // compatibility fallback for older deployments, rather than a duplicate
    // request on every homepage view.
    const featuredRequest = axiosClient.get('/client/featured-properties', { params: { limit: cacheKey } })
      .then((res) => {
        const items = mapPublicResponse(res.data?.data) || []
        if (!items.length) throw new Error('No featured properties returned')
        return items
      })

    const promise = featuredRequest.catch(() => axiosClient
      .get('/client/getPropertyList', { params: { cityName: MVP_CITY, limit: cacheKey } })
      .then((res) => mapPublicResponse(res.data?.data) || [])
      .catch(() => mapPublicResponse(demoProperties.slice(0, cacheKey))))
      .then((items) => {
        featuredPropertiesCache = { limit: cacheKey, items }
        return items
      })
      .finally(() => {
        featuredPropertiesPromise = null
      })
    featuredPropertiesPromise = { limit: cacheKey, promise }
    return promise
  },

  // Popular: full marketplace list for secondary pages/sections.
  popular: () => isDemoPropertyMode()
    ? Promise.resolve(mapPublicResponse(demoProperties))
    : axiosClient.get('/client/getPropertyList', { params: { cityName: MVP_CITY } }).then((res) => mapPublicResponse(res.data && res.data.data)),
  all: (params = {}) => isDemoPropertyMode(params)
    ? Promise.resolve(mapPublicResponse(filterDemoProperties(params)))
    : axiosClient.get('/client/getAllPropertyList', { params: { ...params, cityName: MVP_CITY } }).then((res) => mapPublicResponse(res.data && res.data.data)),
  review: ({ id, approvalStatus }) => axiosClient.post('/client/reviewProperty', { id, approvalStatus }).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'Property review was not updated')
    }
    return normalizeProperty(res.data?.data)
  }),
  propertyTypes: () => axiosClient.get('/client/getPropertyType').then((res) => res.data?.data || []),

  // Try city/area lookups if provided, otherwise return full list
  nearby: (coords) => {
    if (isDemoPropertyMode(coords || {})) return Promise.resolve(mapPublicResponse(filterDemoProperties(coords || {})))
    if (!coords) return axiosClient.get('/client/getPropertyList', { params: { cityName: MVP_CITY } }).then((res) => mapPublicResponse(res.data && res.data.data))
    if (coords.areaName) return axiosClient.post('/client/getPropertyByArea', { cityName: MVP_CITY, areaName: coords.areaName }).then((res) => mapPublicResponse(res.data && res.data.data))
    return axiosClient.post('/client/getPropertyByCity', { cityName: MVP_CITY }).then((res) => mapPublicResponse(res.data && res.data.data))
  },

  // Shortlist expects userIDFK and propertyIDFK
  shortlist: ({ userIDFK, propertyIDFK }) => {
    if (isStaticDemoPropertyId(propertyIDFK)) {
      writeDemoShortlistIds(userIDFK, [...readDemoShortlistIds(userIDFK), propertyIDFK])
      return Promise.resolve(getDemoPropertyById(propertyIDFK))
    }
    return axiosClient.post('/client/addShortlist', { userIDFK, propertyIDFK }).then((res) => res.data && res.data.data)
  },
  removeShortlist: ({ userIDFK, propertyIDFK }) => {
    if (isStaticDemoPropertyId(propertyIDFK)) {
      writeDemoShortlistIds(userIDFK, readDemoShortlistIds(userIDFK).filter((id) => id !== propertyIDFK))
      return Promise.resolve(1)
    }
    return axiosClient.post('/client/deleteShortlist', { userIDFK, propertyIDFK }).then((res) => res.data && res.data.data)
  },

  shortlistByUser: (userIDFK) => {
    const staticItems = demoShortlistItems(userIDFK)
    return axiosClient.post('/client/getShortlistById', { userIDFK })
      .then((res) => [...(res.data?.data || []).map(normalizeShortlistItem), ...staticItems])
      .catch((error) => {
        if (staticItems.length) return staticItems
        throw error
      })
  },

  // Book visit uses /addVisit (expects userIDFK, propertyIDFK, visitDate)
  bookVisit: ({ userIDFK, propertyIDFK, visitDate, visitTime, moveInPreference }) => axiosClient.post('/client/addVisit', { userIDFK, propertyIDFK, visitDate, visitTime, moveInPreference }).then((res) => res.data && res.data.data),
  expressInterest: ({ userIDFK, propertyIDFK, subject, description, preferredVisitTime, moveInPreference }) => axiosClient.post('/client/addInterest', { userIDFK, propertyIDFK, subject, description, preferredVisitTime, moveInPreference }).then((res) => res.data && res.data.data),
  reviews: (params = {}) => isStaticDemoPropertyId(params.propertyId || params.propertyIDFK)
    ? Promise.resolve([])
    : axiosClient.get('/client/reviews', { params }).then((res) => res.data?.data || []),
  addReview: (payload) => axiosClient.post('/client/addReview', payload).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Review could not be saved')
    return res.data?.data
  }),
  submitMoveIn: (payload) => axiosClient.post('/client/moveIns', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Move-in could not be submitted')
    return res.data?.data
  }),
  sendChat: (payload) => axiosClient.post('/client/chats', payload).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Message could not be sent')
    return res.data?.data
  }),
  reportProperty: (payload) => axiosClient.post('/client/properties/report', payload).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Property report could not be submitted')
    return res.data?.data
  }),
  recordViewed: (payload) => isStaticDemoPropertyId(payload?.propertyId)
    ? Promise.resolve([])
    : axiosClient.post('/client/user/viewed-properties', payload).then((res) => res.data?.data || []),
  recordComparison: (payload) => (payload?.propertyIds || []).some(isStaticDemoPropertyId)
    ? Promise.resolve([])
    : axiosClient.post('/client/user/comparison-history', payload).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Comparison history could not be saved')
    return res.data?.data || []
  }),
  updateOccupancy: (id, payload) => axiosClient.post(`/client/properties/${id}/occupancy`, payload).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Occupancy could not be updated')
    return normalizeProperty(res.data?.data)
  }),
  requestProtectedUpdate: (id, payload) => axiosClient.post(`/client/properties/${id}/update-request`, payload).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Update request could not be submitted')
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

  update: (id, payload) => {
    const body = payload instanceof FormData ? payload : { id, ...payload }
    if (payload instanceof FormData && !payload.has('id')) payload.append('id', id)
    return axiosClient.post('/client/updateProperty', body, payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'Property was not updated')
    }
    return res.data?.data
    })
  },

  remove: (id, payload = {}) => axiosClient.post('/client/deleteProperty', { id, ...payload }).then((res) => {
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
