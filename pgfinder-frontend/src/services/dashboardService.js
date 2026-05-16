import dashboardApi from '../api/dashboardApi'

const dashboardService = {
  getAdminStats: () => dashboardApi.adminStats(),
  getVendorOverview: () => dashboardApi.vendorOverview(),
  getUserOverview: (userIDFK) => dashboardApi.userOverview(userIDFK),
  getAdminUsers: () => dashboardApi.adminUsers(),
  getVendorProperties: () => dashboardApi.vendorProperties(),
}

export default dashboardService
