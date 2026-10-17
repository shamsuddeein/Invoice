import { getDbConfig } from './lib/env-config.mjs'

// Env-driven via lib/env-config.js so the same config works consistently for
// local files (dev) and Turso (prod), while loading .env.local and preserving
// explicit shell environment overrides.
const { url, authToken } = getDbConfig()

/** @type {import('drizzle-kit').Config} */
export default {
  schema: './lib/schema.js',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url,
    authToken,
  },
  verbose: true,
  strict: true,
}
