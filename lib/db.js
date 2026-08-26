import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

// Dev defaults to a local libSQL file so the app runs with no cloud secrets.
// Production sets TURSO_DATABASE_URL (libsql://...) + TURSO_AUTH_TOKEN.
const url = process.env.TURSO_DATABASE_URL || 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN || undefined

// Reuse a single client across hot reloads in dev.
const globalForDb = globalThis
const client = globalForDb.__libsqlClient ?? createClient({ url, authToken })
if (process.env.NODE_ENV !== 'production') globalForDb.__libsqlClient = client

export const db = drizzle(client, { schema })
