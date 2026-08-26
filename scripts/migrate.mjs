// Applies the generated SQL migrations in ./drizzle to the target database and
// records them in __drizzle_migrations. Non-interactive — use this instead of
// `drizzle-kit push` for scripted/CI runs.
//
//   npm run db:migrate          (defaults to file:local.db)
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

const url = process.env.TURSO_DATABASE_URL || 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN || undefined
const client = createClient({ url, authToken })
const db = drizzle(client)

await migrate(db, { migrationsFolder: './drizzle' })
console.log('✓ migrations applied to', url)
process.exit(0)
