import fs from 'fs'
import path from 'path'
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL || 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN || undefined
const client = createClient({ url, authToken })

// Apply every drizzle/*.sql migration in filename order (0000, 0001, …). Each
// file is split on Drizzle's `--> statement-breakpoint` marker and run
// statement-by-statement; "already exists" errors are skipped so re-running is
// idempotent. Runs against file:local.db by default, or Turso when its env
// vars are set.
const dir = './drizzle'
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

for (const file of files) {
  const sqlFile = fs.readFileSync(path.join(dir, file), 'utf8')
  const statements = sqlFile
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    try {
      await client.execute(stmt)
    } catch (err) {
      if (err.message?.includes('already exists')) {
        // Table or index already exists, safe to continue
        continue
      }
      throw err
    }
  }
  console.log('✓ applied', file)
}

console.log('✓ migrations verified and up-to-date on:', url)
process.exit(0)
