import dashboardApi from '../api/dashboardApi'

const getLeadBundle = async (userIDFK) => {
  const [visits, inquiries, shortlists] = await Promise.all([
    dashboardApi.vendorVisits(userIDFK),
    dashboardApi.vendorInquiries(userIDFK),
    dashboardApi.vendorShortlists ? dashboardApi.vendorShortlists(userIDFK) : Promise.resolve([]),
  ])
  const shortlistCount = shortlists.reduce((sum, item) => sum + (Number(item.wishlistCount) || 0), 0)
  return { visits, inquiries, shortlists, totalLeads: visits.length + inquiries.length, shortlistCount }
}

const dashboardService = {
  getAdminStats: () => dashboardApi.adminStats(),
  getAdminVendorLeadSummary: () => dashboardApi.adminVendorLeadSummary(),
  getVendorOverview: (userIDFK) => dashboardApi.vendorOverview(userIDFK),
  getOwnerOverview: (userIDFK) => dashboardApi.vendorOverview(userIDFK),
  getVendorLeads: getLeadBundle,
  getOwnerLeads: getLeadBundle,
  getUserOverview: (userIDFK) => dashboardApi.userOverview(userIDFK),
  getAdminUsers: (filters) => dashboardApi.adminUsers(filters),
  updateUserStatus: (payload) => dashboardApi.updateUserStatus(payload),
  markLeadConverted: (payload) => dashboardApi.markLeadConverted(payload),
  getVendorProperties: (userIDFK) => dashboardApi.vendorProperties(userIDFK),
  getOwnerProperties: (userIDFK) => dashboardApi.vendorProperties(userIDFK),
  moveIns: (params) => dashboardApi.moveIns(params),
}

export default dashboardService
