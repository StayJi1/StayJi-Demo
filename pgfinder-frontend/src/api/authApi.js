import axiosClient from './axiosClient'

// Backend exposes client routes under /client
const authApi = {
  // backend: POST /client/loginByUser expects { userEmail, userPassword }
  login: (credentials) => axiosClient.post('/client/loginByUser', credentials).then((res) => res.data),
  // backend: POST /client/addUser expects fields like userFname,userLname,userEmail,userPassword,gender
  signup: (payload) => axiosClient.post('/client/addUser', payload).then((res) => res.data),
}

export default authApi
