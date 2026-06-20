export const MVP_CITY = 'Bangalore'
export const MVP_STATE = 'Karnataka'
export const MVP_CITY_ALIASES = ['bangalore', 'bengaluru']

export const normalizeMvpCity = (value = MVP_CITY) => {
  const normalized = value.toString().trim().toLowerCase()
  return MVP_CITY_ALIASES.includes(normalized) ? MVP_CITY : value
}

export const isMvpCity = (value = '') => MVP_CITY_ALIASES.includes(value.toString().trim().toLowerCase())
