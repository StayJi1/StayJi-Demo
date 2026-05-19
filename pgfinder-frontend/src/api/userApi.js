import axiosClient from './axiosClient'

const userApi = {
  authStatus: (id) => axiosClient.post('/client/authStatus', { id }).then((res) => {
    if (res.data?.result !== 'success') {
      throw new Error(res.data?.msg || 'Account inactive')
    }
    return res.data?.data
  }),
  update: (payload) => axiosClient.post('/client/updateUser', payload).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'User update failed')
    }
    return res.data?.data
  }),
}

export default userApi
