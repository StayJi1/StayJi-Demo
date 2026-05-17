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
  bookVisit: ({ userIDFK, propertyIDFK, visitDate }) => propertyApi.bookVisit({ userIDFK, propertyIDFK, visitDate }),
  expressInterest: ({ userIDFK, propertyIDFK, subject, description }) => propertyApi.expressInterest({ userIDFK, propertyIDFK, subject, description }),
  createProperty: (payload) => propertyApi.create(payload),
  updateProperty: (id, payload) => propertyApi.update(id, payload),
  reviewProperty: (id, approvalStatus) => propertyApi.review({ id, approvalStatus }),
  deleteProperty: (id) => propertyApi.remove(id),
  reactivateProperty: (id) => propertyApi.reactivate(id),
}

export default propertyService
