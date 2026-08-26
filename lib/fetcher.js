// Thin client-side fetch wrapper: JSON in/out with a thrown Error on non-2xx
// (so forms can catch and surface `err.message`). UI Rule 10 — always show a
// real error message on failure.
export async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`)
  }
  return data
}
