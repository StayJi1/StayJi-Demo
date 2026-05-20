import axiosClient from './axiosClient'

const unwrap = (response, fallback) => {
  if (response.data?.result === 'failure') {
    throw new Error(response.data?.msg || 'Notification request failed')
  }
  return response.data?.data ?? fallback
}

const notificationApi = {
  list: ({ userId, role, limit = 20 } = {}) => axiosClient
    .get('/api/notifications', { params: { userId, role, limit } })
    .then((res) => unwrap(res, { items: [], unreadCount: 0 })),
  markRead: (id) => axiosClient.post(`/api/notifications/${id}/read`).then((res) => unwrap(res, null)),
  markAllRead: ({ userId, role } = {}) => axiosClient
    .post('/api/notifications/mark-read', { userId, role })
    .then((res) => unwrap(res, { modifiedCount: 0 })),
}

export default notificationApi
