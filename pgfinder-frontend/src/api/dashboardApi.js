import axiosClient from './axiosClient'

const normalizeUser = (user) => ({
  ...user,
  id: user._id || user.id,
  name: user.name || [user.userFname, user.userLname].filter(Boolean).join(' ') || user.userEmail,
  email: user.userEmail || user.email,
  role: (user.role || user.userType || 'user').toString().toLowerCase(),
})

const normalizeProperty = (property) => ({
  ...property,
  id: property._id || property.id,
  name: property.propertyName || property.name,
  ownerId: property.userIDFK?._id || property.userIDFK || '',
  city: property.cityName || property.city,
  rent: Number(property.rent) || property.rent,
  depositAmount: Number(property.depositAmount) || property.depositAmount || 0,
  category: property.propertyCategory || property.category || property.propertyTypeIDFK?.typeName || 'PG',
  type: property.propertyCategory || property.propertyTypeIDFK?.typeName || property.type || 'PG',
  approvalStatus: property.approvalStatus || 'Approved',
  perDayCheckIn: Boolean(property.perDayCheckIn),
  dailyRate: Number(property.dailyRate) || property.dailyRate || 0,
  availableBeds: Number(property.availableBeds) || 0,
  vacancyStatus: property.vacancyStatus || (property.isAvailable === false ? 'Fully occupied' : 'Available now'),
  availableFrom: property.availableFrom || '',
  sharingAvailability: property.sharingAvailability || property.sharing || '',
  parkingAvailable: Boolean(property.parkingAvailable),
  acAvailable: Boolean(property.acAvailable),
  rating: Number(property.rating) || property.rating || 4.6,
  status: property.isAvailable === false ? 'Booked' : 'Available',
})


const getAdminUsers = (params) => axiosClient.get('/client/getAdminUsers', { params }).then((res) => (res.data?.data || []).map(normalizeUser))
const getProperties = () => axiosClient.get('/client/getAllPropertyList').then((res) => (res.data?.data || []).map(normalizeProperty))
const getPropertiesByUser = (userIDFK) => axiosClient.post('/client/getPropertyListByUser', { userIDFK }).then((res) => (res.data?.data || []).map(normalizeProperty))

const getShortlist = (userIDFK) => axiosClient.post('/client/getShortlistById', { userIDFK }).then((res) => res.data?.data || [])
const getVendorVisits = (userIDFK) => axiosClient.post('/client/getVisitorList', { userIDFK }).then((res) => res.data?.data || [])
const getVendorInquiries = (userIDFK) => axiosClient.post('/client/getInquiry', { userIDFK }).then((res) => res.data?.data || [])
const getVendorShortlists = (userIDFK) => axiosClient.post('/client/getShortlistByVendor', { userIDFK }).then((res) => res.data?.data || [])

// New synchronized full-profile endpoints
const adminSearchProperty = ({ q, limit } = {}) => axiosClient
  .post('/client/admin/searchProperty', { q, limit })
  .then((res) => res.data?.data || { properties: [] })

const getVendorFullProfile = (vendorId) => axiosClient
  .post('/client/admin/getVendorFullProfile', { vendorId })
  .then((res) => res.data?.data || null)

const getVendorFullProfileForVendor = (vendorId) => axiosClient
  .post('/client/vendor/getVendorFullProfile', { vendorId })
  .then((res) => res.data?.data || null)


const dashboardApi = {
  adminStats: async () => {
    const res = await axiosClient.get('/client/getAdminStats')
    return res.data?.data || { users: 0, vendors: 0, properties: 0, inactiveProperties: 0, inquiries: 0, pendingProperties: 0, leads: 0 }
  },
  vendorOverview: async (userIDFK) => {
    const [properties, visits, inquiries, shortlists] = userIDFK
      ? await Promise.all([getPropertiesByUser(userIDFK), getVendorVisits(userIDFK), getVendorInquiries(userIDFK), getVendorShortlists(userIDFK)])
      : [await getProperties(), [], [], []]
    return {
      totalProperties: properties.length,
      inquiries: inquiries.length,
      bookings: visits.length,
      savedByStudents: shortlists.length,
      views: properties.length * 12,
      leads: visits.length + inquiries.length + shortlists.length,
    }
  },
  userOverview: async (userIDFK) => {
    if (userIDFK) {
      const res = await axiosClient.get('/client/user/overview', { params: { userId: userIDFK } })
      if (res.data?.result === 'success') return res.data.data
    }
    const shortlist = userIDFK ? await getShortlist(userIDFK) : []
    return {
      shortlist: shortlist.length,
      shortlistItems: shortlist.map((item) => ({
        id: item._id,
        property: normalizeProperty(item.propertyIDFK || {}),
      })),
      visits: [],
      inquiries: [],
      messages: [],
      savedSearches: [],
      viewedProperties: [],
      notifications: [],
      wallet: { totalCoins: 0, approvedRewards: 0, pendingRewards: 0 },
    }
  },
  adminUsers: getAdminUsers,
  adminSearchProperty,
  getVendorFullProfile,
  getVendorFullProfileForVendor,
  adminVendorLeadSummary: async () => {

    const res = await axiosClient.get('/client/getAdminVendorLeadSummary')
    return res.data?.data || { totalLeads: 0, vendors: [] }
  },
  updateUserStatus: ({ id, isActive, userType }) => axiosClient.post('/client/updateUserStatus', { id, isActive, userType }).then((res) => normalizeUser(res.data?.data)),
  vendorProperties: getPropertiesByUser,
  vendorVisits: getVendorVisits,
  vendorInquiries: getVendorInquiries,
  vendorShortlists: getVendorShortlists,
  moveIns: (params) => axiosClient.get('/client/moveIns', { params }).then((res) => res.data?.data || []),
  saveSearch: (payload) => axiosClient.post('/client/user/saved-searches', payload).then((res) => res.data?.data || []),
  deleteSavedSearch: (id, userId) => axiosClient.delete(`/client/user/saved-searches/${id}`, { params: { userId } }).then((res) => res.data?.data || []),
  chats: (params) => axiosClient.get('/client/chats', { params }).then((res) => res.data?.data || []),
  sendChat: (payload) => axiosClient.post('/client/chats', payload).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Message could not be sent')
    return res.data?.data
  }),
  updateVisit: (id, payload) => axiosClient.post(`/client/visits/${id}/status`, payload).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Visit could not be updated')
    return res.data?.data
  }),
  walletPayouts: (params) => axiosClient.get('/client/wallet/payouts', { params }).then((res) => res.data?.data || []),
  requestWalletPayout: (payload) => axiosClient.post('/client/wallet/payouts', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => {
    if (res.data?.result === 'failure') throw new Error(res.data?.msg || 'Payout could not be requested')
    return res.data?.data
  }),
  markLeadConverted: ({ id, type }) => axiosClient.post('/client/markLeadConverted', { id, type }).then((res) => {
    if (res.data?.result !== 'success') throw new Error(res.data?.msg || 'Unable to convert lead')
    return res.data?.data
  }),
}

export default dashboardApi
