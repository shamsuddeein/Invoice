import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

// Password hashing with Node's built-in crypto (scrypt) — zero extra deps.
// Stored format: `scrypt$<saltHex>$<hashHex>`. Node runtime ONLY — never import
// this from edge middleware.
const KEYLEN = 64

export function hashPassword(plain) {
  const salt = randomBytes(16)
  const hash = scryptSync(String(plain), salt, KEYLEN)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(plain, stored) {
  if (typeof stored !== 'string') return false
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false

  const salt = Buffer.from(parts[1], 'hex')
  const expected = Buffer.from(parts[2], 'hex')
  let actual
  try {
    actual = scryptSync(String(plain), salt, expected.length)
  } catch {
    return false
  }
  // timingSafeEqual throws on length mismatch — guard first.
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

// Constant-time string compare for the OWNER_PASSWORD env bootstrap (used before
// a hash is stored). Plain `a === b` short-circuits on the first differing byte,
// leaking length/prefix via timing. Hashing both sides to fixed 32-byte SHA-256
// digests lets timingSafeEqual run in constant time regardless of input length.
export function safeEqual(a, b) {
  const da = createHash('sha256').update(String(a)).digest()
  const db = createHash('sha256').update(String(b)).digest()
  return timingSafeEqual(da, db)
}
