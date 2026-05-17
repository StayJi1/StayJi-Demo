import dashboardApi from '../api/dashboardApi'

const dashboardService = {
  getAdminStats: () => dashboardApi.adminStats(),
  getAdminVendorLeadSummary: () => dashboardApi.adminVendorLeadSummary(),
  getVendorOverview: (userIDFK) => dashboardApi.vendorOverview(userIDFK),
  getVendorLeads: async (userIDFK) => {
    const [visits, inquiries, shortlists] = await Promise.all([
      dashboardApi.vendorVisits(userIDFK),
      dashboardApi.vendorInquiries(userIDFK),
      dashboardApi.vendorShortlists ? dashboardApi.vendorShortlists(userIDFK) : Promise.resolve([]),
    ])
    return { visits, inquiries, shortlists, totalLeads: visits.length + inquiries.length + shortlists.length }
  },
  getUserOverview: (userIDFK) => dashboardApi.userOverview(userIDFK),
  getAdminUsers: (filters) => dashboardApi.adminUsers(filters),
  updateUserStatus: (payload) => dashboardApi.updateUserStatus(payload),
  getVendorProperties: (userIDFK) => dashboardApi.vendorProperties(userIDFK),
}

export default dashboardService
