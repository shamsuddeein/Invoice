import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

import { getDbConfig } from './env-config'

// Dev defaults to a local libSQL file so the app runs with no cloud secrets.
// Production sets TURSO_DATABASE_URL (libsql://...) + TURSO_AUTH_TOKEN.
const { url, authToken } = getDbConfig()

// Reuse a single client across hot reloads in dev.
const globalForDb = globalThis
const client = globalForDb.__libsqlClient ?? createClient({ url, authToken })
if (process.env.NODE_ENV !== 'production') globalForDb.__libsqlClient = client

export const db = drizzle(client, { schema })
