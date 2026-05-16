import dashboardApi from '../api/dashboardApi'

const dashboardService = {
  getAdminStats: () => dashboardApi.adminStats(),
  getVendorOverview: (userIDFK) => dashboardApi.vendorOverview(userIDFK),
  getUserOverview: (userIDFK) => dashboardApi.userOverview(userIDFK),
  getAdminUsers: () => dashboardApi.adminUsers(),
  getVendorProperties: (userIDFK) => dashboardApi.vendorProperties(userIDFK),
}

export default dashboardService
