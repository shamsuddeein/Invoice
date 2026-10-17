import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../lib/schema.js'

/**
 * Creates an isolated test database initialized with all migrations from drizzle/*.sql
 */
export async function createTestDb() {
  const scratchDir = path.resolve(process.cwd(), 'scratch')
  fs.mkdirSync(scratchDir, { recursive: true })
  const dbFile = path.join(scratchDir, `test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`)
  const client = createClient({ url: `file:${dbFile}` })
  const drizzleDir = path.resolve(process.cwd(), 'drizzle')
  const files = fs.readdirSync(drizzleDir).filter((f) => f.endsWith('.sql')).sort()

  for (const file of files) {
    const content = fs.readFileSync(path.join(drizzleDir, file), 'utf8')
    const stmts = content
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean)

    for (const stmt of stmts) {
      try {
        await client.execute(stmt)
      } catch (err) {
        if (
          err.message?.includes('already exists') ||
          err.message?.includes('duplicate column name')
        ) {
          continue
        }
        throw err
      }
    }
  }

  const dbClient = drizzle(client, { schema })

  const cleanup = () => {
    try {
      client.close()
    } catch {}
    try {
      if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile)
    } catch {}
  }

  return { client, dbClient, cleanup }
}
