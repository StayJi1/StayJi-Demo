import axiosClient from './axiosClient'

const unwrapAuthResponse = (request) => request
  .then((res) => res.data)
  .catch((error) => {
    if (error.response?.data) return error.response.data
    throw error
  })

// Backend exposes client routes under /client
const authApi = {
  // backend: POST /client/loginByUser expects { userEmail, userPassword }
  login: (credentials) => unwrapAuthResponse(axiosClient.post('/client/loginByUser', credentials)),
  // backend: POST /client/addUser expects fields like userFname,userLname,userEmail,userPassword,gender
  signup: (payload) => unwrapAuthResponse(axiosClient.post('/client/addUser', payload)),
  googleAuth: (payload) => unwrapAuthResponse(axiosClient.post('/client/googleAuth', payload)),
  requestPasswordReset: (payload) => axiosClient.post('/client/requestPasswordReset', payload).then((res) => res.data),
  resetPasswordWithOtp: (payload) => axiosClient.post('/client/resetPasswordWithOtp', payload).then((res) => res.data),
  changePassword: (payload) => axiosClient.post('/client/changePassword', payload).then((res) => res.data),
}

export default authApi
