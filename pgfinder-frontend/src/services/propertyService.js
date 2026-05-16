import propertyApi from '../api/propertyApi'

const propertyService = {
  fetchProperties: (filters) => propertyApi.list(filters),
  fetchPropertyById: (id) => propertyApi.detail(id),
  fetchPopularProperties: () => propertyApi.popular(),
  fetchNearbyProperties: (coords) => propertyApi.nearby(coords),
  shortlistProperty: ({ userIDFK, propertyIDFK }) => propertyApi.shortlist({ userIDFK, propertyIDFK }),
  fetchShortlist: (userIDFK) => propertyApi.shortlistByUser(userIDFK),
  bookVisit: ({ userIDFK, propertyIDFK, visitDate }) => propertyApi.bookVisit({ userIDFK, propertyIDFK, visitDate }),
  createProperty: (payload) => propertyApi.create(payload),
}

export default propertyService
