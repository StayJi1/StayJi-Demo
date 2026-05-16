import axiosClient from './axiosClient'

const userApi = {
  update: (payload) => axiosClient.post('/client/updateUser', payload).then((res) => {
    if (res.data?.result === 'failure') {
      throw new Error(res.data?.msg || 'User update failed')
    }
    return res.data?.data
  }),
}

export default userApi
