const enabled = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase())

// The production default is always the API. Enable the static demo inventory
// explicitly in a demo deployment, or open /properties?demo=true for a
// walkthrough without loading the owner-listing API.
export const isDemoPropertyMode = (params = {}) => {
  if (enabled(params.demo)) return true
  if (enabled(import.meta.env.VITE_DEMO_PROPERTY_MODE)) return true
  if (typeof window === 'undefined') return false
  return enabled(new URLSearchParams(window.location.search).get('demo'))
}
