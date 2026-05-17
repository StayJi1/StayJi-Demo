const crypto = require('crypto')

const HASH_PREFIX = 'pbkdf2$sha256'
const ITERATIONS = 120000
const KEY_LENGTH = 32
const DIGEST = 'sha256'

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(String(password || ''), salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
  return `${HASH_PREFIX}$${ITERATIONS}$${salt}$${hash}`
}

function isHashedPassword(value) {
  return typeof value === 'string' && value.startsWith(`${HASH_PREFIX}$`)
}

function verifyPassword(password, storedPassword) {
  if (!isHashedPassword(storedPassword)) {
    return String(password || '') === String(storedPassword || '')
  }

  const [, , iterations, salt, storedHash] = storedPassword.split('$')
  const hash = crypto
    .pbkdf2Sync(String(password || ''), salt, Number(iterations), KEY_LENGTH, DIGEST)
    .toString('hex')

  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))
}

module.exports = {
  hashPassword,
  isHashedPassword,
  verifyPassword,
}
