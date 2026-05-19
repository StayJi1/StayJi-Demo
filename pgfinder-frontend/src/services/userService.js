import userApi from '../api/userApi'

const userService = {
  authStatus: (id) => userApi.authStatus(id),
  updateUser: (userData) => userApi.update(userData),
}

export default userService
