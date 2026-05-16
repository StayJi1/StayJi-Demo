import userApi from '../api/userApi'

const userService = {
  updateUser: (userData) => userApi.update(userData),
}

export default userService
