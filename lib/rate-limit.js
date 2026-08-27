// Best-effort in-memory fixed-window rate limiter for the auth endpoints
// (login + password change). Keyed by client IP so a flood from one source is
// throttled without ever locking out the sole owner by username.
//
// CAVEAT: this is per-process state. On serverless (Vercel) each instance has
// its own map and instances are ephemeral, so this is defense-in-depth that
// slows scripted brute force — NOT a hard, cluster-wide guarantee. A durable
// limit would need an external store (e.g. Upstash); intentionally avoided here
// to keep zero new dependencies for a single-user app. The real brute-force
// mitigations are the slow scrypt hash and a strong owner password.
const buckets = new Map()

// Occasionally evict expired buckets so the map can't grow unbounded.
function sweep(now) {
  if (buckets.size < 500) return
  for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k)
}

// Returns { ok, remaining, retryAfterSec }. `ok:false` means the caller should
// reject (429 / auth failure). A fresh window starts on the first hit and on any
// hit after the previous window expired.
export function rateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now()
  sweep(now)
  const b = buckets.get(key)
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 }
  }
  b.count += 1
  if (b.count > limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.reset - now) / 1000) }
  }
  return { ok: true, remaining: limit - b.count, retryAfterSec: 0 }
}

// Extract a best-effort client IP from a Request's forwarding headers.
export function clientIp(req) {
  const xff = req?.headers?.get?.('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req?.headers?.get?.('x-real-ip') || 'unknown'
}
