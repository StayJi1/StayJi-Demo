import axiosClient from './axiosClient'

const unwrap = (response, fallback) => {
  if (response.data?.result === 'failure') {
    throw new Error(response.data?.msg || 'Admin API request failed')
  }
  return response.data?.data ?? fallback
}

const paramsWithDefaults = (params = {}) => ({
  page: 1,
  limit: 20,
  ...Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)),
})

const normalizeUser = (user = {}) => ({
  ...user,
  id: user.id || user._id,
  name: user.name || [user.userFname, user.userLname].filter(Boolean).join(' ') || user.userEmail || user.email,
  email: user.email || user.userEmail,
  contact: user.contact || user.phone,
  role: (user.role || user.userType || 'user').toString().toLowerCase(),
  isActive: user.isActive !== false,
})

const adminApi = {
  analytics: () => axiosClient.get('/api/admin/analytics').then((res) => unwrap(res, { summary: {}, trends: [], cityHeatmap: [], topProperties: [] })),
  properties: (params) => axiosClient.get('/api/admin/properties', { params: paramsWithDefaults(params) }).then((res) => unwrap(res, { items: [] })),
  propertyDetail: (id) => axiosClient.get(`/api/admin/properties/${id}`).then((res) => unwrap(res, null)),
  updatePropertyStatus: (id, payload) => axiosClient.post(`/api/admin/properties/${id}/status`, payload).then((res) => unwrap(res, null)),
  bulkProperties: (payload) => axiosClient.post('/api/admin/properties/bulk', payload).then((res) => unwrap(res, null)),
  vendors: (params) => axiosClient.get('/api/admin/vendors', { params: paramsWithDefaults(params) }).then((res) => unwrap(res, { items: [] })),
  vendorDetail: (id) => axiosClient.get(`/api/admin/vendors/${id}`).then((res) => unwrap(res, null)),
  users: (params) => axiosClient.get('/api/admin/users', { params: paramsWithDefaults(params) }).then((res) => (unwrap(res, []) || []).map(normalizeUser)),
  updateUser: (id, payload) => axiosClient.post(`/api/admin/users/${id}`, payload).then((res) => normalizeUser(unwrap(res, null))),
  updateUserStatus: (id, payload) => axiosClient.post(`/api/admin/users/${id}/status`, payload).then((res) => normalizeUser(unwrap(res, null))),
  leads: (params) => axiosClient.get('/api/admin/leads', { params: paramsWithDefaults(params) }).then((res) => unwrap(res, { items: [] })),
  vendorMessages: (id, params) => axiosClient.get(`/api/admin/vendors/${id}/messages`, { params }).then((res) => unwrap(res, [])),
  sendVendorMessage: (id, payload) => axiosClient.post(`/api/admin/vendors/${id}/messages`, payload).then((res) => unwrap(res, null)),
  deleteVendorMessage: (vendorId, messageId, payload) => axiosClient.post(`/api/admin/vendors/${vendorId}/messages/${messageId}/delete`, payload).then((res) => unwrap(res, null)),
}

export default adminApi
