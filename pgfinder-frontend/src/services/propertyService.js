import propertyApi from '../api/propertyApi'

const propertyService = {
  fetchProperties: (filters) => propertyApi.list(filters),
  fetchAllProperties: () => propertyApi.all(),
  fetchPropertyById: (id) => propertyApi.detail(id),
  fetchPopularProperties: () => propertyApi.popular(),
  fetchNearbyProperties: (coords) => propertyApi.nearby(coords),
  fetchPropertyTypes: () => propertyApi.propertyTypes(),
  shortlistProperty: ({ userIDFK, propertyIDFK }) => propertyApi.shortlist({ userIDFK, propertyIDFK }),
  fetchShortlist: (userIDFK) => propertyApi.shortlistByUser(userIDFK),
  bookVisit: ({ userIDFK, propertyIDFK, visitDate }) => propertyApi.bookVisit({ userIDFK, propertyIDFK, visitDate }),
  createProperty: (payload) => propertyApi.create(payload),
  updateProperty: (id, payload) => propertyApi.update(id, payload),
  reviewProperty: (id, approvalStatus) => propertyApi.review({ id, approvalStatus }),
  deleteProperty: (id) => propertyApi.remove(id),
}

export default propertyService
