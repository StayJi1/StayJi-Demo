import authApi from '../api/authApi'

// Adapt frontend auth flow to the legacy backend (/client/*) responses.
const authService = {
  login: async (credentials) => {
    const res = await authApi.login(credentials)
    // backend responds with { result: "success"|"fail", msg: string, data: <user|null> }
    if (res && (res.result === 'success' || res.result === 'login Successfully')) {
      if (!res.token || !res.data) {
        throw new Error('Login succeeded but the server did not return an authentication token.')
      }
      return { token: res.token || null, user: res.data || res.user, role: res.role }
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
        accountType: payload.userType,
        authPortal: 'public',
      }
      const loginRes = await authApi.login(loginPayload)
      if (loginRes && loginRes.result === 'success' && loginRes.token && loginRes.data) {
        return { token: loginRes.token || null, user: loginRes.data, role: loginRes.role }
      }
      throw new Error('Signup succeeded but the server did not return an authentication token.')
    }
    const message = res?.msg || 'Signup failed'
    const err = new Error(message)
    err.response = { data: res }
    throw err
  },

  googleSignup: async (payload) => {
    const res = await authApi.googleAuth(payload)
    if (res && res.result === 'success' && res.token && res.data) {
      return { token: res.token || null, user: res.data, role: res.role }
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
  changePassword: async (payload) => {
    const res = await authApi.changePassword(payload)
    if (res?.result === 'success') return res
    throw new Error(res?.msg || 'Unable to change password')
  },
}

export default authService
