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
  city: property.cityName || property.city,
  rent: Number(property.rent) || property.rent,
  status: property.isAvailable === false ? 'Booked' : 'Available',
})

const getUsers = () => axiosClient.get('/client/getUserList').then((res) => (res.data?.data || []).map(normalizeUser))
const getProperties = () => axiosClient.get('/client/getPropertyList').then((res) => (res.data?.data || []).map(normalizeProperty))

const getShortlist = (userIDFK) => axiosClient.post('/client/getShortlistById', { userIDFK }).then((res) => res.data?.data || [])

const dashboardApi = {
  adminStats: async () => {
    const [users, properties] = await Promise.all([getUsers(), getProperties()])
    return {
      users: users.length,
      vendors: users.filter((user) => ['vendor', 'owner'].includes(user.role)).length,
      properties: properties.length,
      inquiries: 0,
    }
  },
  vendorOverview: async () => {
    const properties = await getProperties()
    return {
      totalProperties: properties.length,
      inquiries: 0,
      bookings: properties.filter((property) => property.status === 'Booked').length,
      views: properties.length * 12,
    }
  },
  userOverview: async (userIDFK) => {
    const shortlist = userIDFK ? await getShortlist(userIDFK) : []
    return {
      shortlist: shortlist.length,
      shortlistItems: shortlist.map((item) => ({
        id: item._id,
        property: normalizeProperty(item.propertyIDFK || {}),
      })),
      visits: 0,
      messages: 0,
      savedSearches: 0,
    }
  },
  adminUsers: getUsers,
  vendorProperties: getProperties,
}

export default dashboardApi
