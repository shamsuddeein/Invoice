import fs from 'fs'
import { createClient } from '@libsql/client/web'

const rawUrl = process.env.TURSO_DATABASE_URL || 'file:local.db'
const url = rawUrl.replace('libsql://', 'https://')
const authToken = process.env.TURSO_AUTH_TOKEN || undefined
const client = createClient({ url, authToken })

const sqlFile = fs.readFileSync('./drizzle/0000_magical_talisman.sql', 'utf8')
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

console.log('✓ migrations verified and up-to-date on Turso:', url)
process.exit(0)
