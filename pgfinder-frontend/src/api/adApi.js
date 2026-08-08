import axiosClient from './axiosClient'

const unwrap = (response, fallback) => response.data?.data ?? fallback

const adApi = {
  active: (placement = 'both') => axiosClient.get('/api/ads', { params: { placement, limit: 4 } }).then((response) => unwrap(response, [])),
  impression: (id) => axiosClient.post(`/api/ads/${id}/impression`).catch(() => {}),
  click: (id) => axiosClient.post(`/api/ads/${id}/click`).catch(() => {}),
}

export default adApi
