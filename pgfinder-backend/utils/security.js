const crypto = require('crypto')
const bcrypt = require('bcryptjs')

const HASH_PREFIX = 'pbkdf2$sha256'
const ITERATIONS = 120000
const KEY_LENGTH = 32
const DIGEST = 'sha256'
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12)

function hashPassword(password) {
  return bcrypt.hashSync(String(password || ''), BCRYPT_ROUNDS)
}

function isHashedPassword(value) {
  return typeof value === 'string' && (value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$') || value.startsWith(`${HASH_PREFIX}$`))
}

function verifyPassword(password, storedPassword) {
  if (typeof storedPassword !== 'string' || !storedPassword) {
    return false
  }

  if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
    return bcrypt.compareSync(String(password || ''), storedPassword)
  }

  if (!storedPassword.startsWith(`${HASH_PREFIX}$`)) {
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
