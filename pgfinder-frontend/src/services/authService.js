import authApi from '../api/authApi'

// Adapt frontend auth flow to the legacy backend (/client/*) responses.
const authService = {
  login: async (credentials) => {
    const res = await authApi.login(credentials)
    // backend responds with { result: "success"|"fail", msg: string, data: <user|null> }
    if (res && (res.result === 'success' || res.result === 'login Successfully')) {
      return { token: null, user: res.data || res.user }
    }
    const message = res?.msg || 'Login failed'
    const err = new Error(message)
    err.response = { data: res }
    throw err
  },

  signup: async (payload) => {
    // backend returns { result: "success", msg: "User Inserted", data: 1 }
    const res = await authApi.signup(payload)
    if (res && res.result === 'success') {
      // try to login the user to fetch created user record
      const loginPayload = {
        userEmail: payload.userEmail,
        userPassword: payload.userPassword,
      }
      const loginRes = await authApi.login(loginPayload)
      if (loginRes && loginRes.result === 'success') {
        return { token: null, user: loginRes.data }
      }
      return { token: null, user: null }
    }
    const message = res?.msg || 'Signup failed'
    const err = new Error(message)
    err.response = { data: res }
    throw err
  },

  googleSignup: async (payload) => {
    const res = await authApi.googleAuth(payload)
    if (res && res.result === 'success') {
      return { token: null, user: res.data }
    }
    const message = res?.msg || 'Google signup failed'
    const err = new Error(message)
    err.response = { data: res }
    throw err
  },
  requestPasswordReset: async (payload) => {
    const res = await authApi.requestPasswordReset(payload)
    if (res?.result === 'success') return res
    throw new Error(res?.msg || 'Unable to start password reset')
  },
  resetPasswordWithOtp: async (payload) => {
    const res = await authApi.resetPasswordWithOtp(payload)
    if (res?.result === 'success') return res
    throw new Error(res?.msg || 'Unable to reset password')
  },
}

export default authService
