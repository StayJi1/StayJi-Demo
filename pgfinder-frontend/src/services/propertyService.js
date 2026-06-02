import propertyApi from '../api/propertyApi'

const propertyService = {
  fetchProperties: (filters) => propertyApi.list(filters),
  fetchAllProperties: (filters) => propertyApi.all(filters),
  fetchPropertyById: (id, options) => propertyApi.detail(id, options),
  fetchPopularProperties: () => propertyApi.popular(),
  fetchNearbyProperties: (coords) => propertyApi.nearby(coords),
  fetchPropertyTypes: () => propertyApi.propertyTypes(),
  shortlistProperty: ({ userIDFK, propertyIDFK }) => propertyApi.shortlist({ userIDFK, propertyIDFK }),
  removeShortlistProperty: ({ userIDFK, propertyIDFK }) => propertyApi.removeShortlist({ userIDFK, propertyIDFK }),
  fetchShortlist: (userIDFK) => propertyApi.shortlistByUser(userIDFK),
  bookVisit: ({ userIDFK, propertyIDFK, visitDate, visitTime, moveInPreference }) => propertyApi.bookVisit({ userIDFK, propertyIDFK, visitDate, visitTime, moveInPreference }),
  expressInterest: ({ userIDFK, propertyIDFK, subject, description, preferredVisitTime, moveInPreference }) => propertyApi.expressInterest({ userIDFK, propertyIDFK, subject, description, preferredVisitTime, moveInPreference }),
  fetchReviews: (params) => propertyApi.reviews(params),
  submitReview: (payload) => propertyApi.addReview(payload),
  sendChat: (payload) => propertyApi.sendChat(payload),
  recordViewed: (payload) => propertyApi.recordViewed(payload),
  submitMoveIn: (payload) => propertyApi.submitMoveIn(payload),
  createProperty: (payload) => propertyApi.create(payload),
  updateProperty: (id, payload) => propertyApi.update(id, payload),
  reviewProperty: (id, approvalStatus) => propertyApi.review({ id, approvalStatus }),
  deleteProperty: (id, payload) => propertyApi.remove(id, payload),
  reactivateProperty: (id) => propertyApi.reactivate(id),
  updateOccupancy: (id, payload) => propertyApi.updateOccupancy(id, payload),
  requestProtectedUpdate: (id, payload) => propertyApi.requestProtectedUpdate(id, payload),
}

export default propertyService
