const DEFAULT_COMPARE_STORAGE_KEY = 'stayjiCompare'

export const getCompareStorageKey = (user) => {
  const userId = user?._id || user?.id || user?.userId || user?.uid
  return userId ? `${DEFAULT_COMPARE_STORAGE_KEY}:${userId}` : `${DEFAULT_COMPARE_STORAGE_KEY}:guest`
}

export const readCompareIds = (user) => {
  try {
    const rawValue = localStorage.getItem(getCompareStorageKey(user))
    if (!rawValue) return []
    const parsed = JSON.parse(rawValue)
    return Array.from(new Set((Array.isArray(parsed) ? parsed : []).filter(Boolean))).slice(0, 3)
  } catch {
    return []
  }
}

export const writeCompareIds = (user, ids = []) => {
  const sanitized = Array.from(new Set((ids || []).filter(Boolean))).slice(0, 3)
  localStorage.setItem(getCompareStorageKey(user), JSON.stringify(sanitized))
  return sanitized
}

export const clearCompareIds = (user) => {
  localStorage.removeItem(getCompareStorageKey(user))
}
