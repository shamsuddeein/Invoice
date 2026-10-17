import fs from 'fs'
import path from 'path'
import { parse } from 'dotenv'

// Custom environment file loader that:
// 1. Preserves explicit shell environment variables (does not overwrite existing process.env values).
// 2. Loads credentials from .env.local (and .env) even when TURSO_DATABASE_URL is already exported in the shell.
// 3. Validates required credentials for remote Turso databases to avoid silently selecting the wrong database.

export function parseEnvFile(filePath) {
  try {
    return parse(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw new Error(`Unable to read environment file: ${filePath}`, { cause: err })
  }
}

export function loadEnv(targetPath) {
  const parsed = parseEnvFile(targetPath || path.resolve(process.cwd(), '.env.local'))
  for (const [key, val] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = val
    }
  }
}

// Automatically load .env.local first, then .env as secondary fallback
loadEnv(path.resolve(process.cwd(), '.env.local'))
loadEnv(path.resolve(process.cwd(), '.env'))

// Validate database configuration with support for test overrides
export function getDbConfig({ env = process.env, projectDir = process.cwd() } = {}) {
  const fileEnv = {
    ...parseEnvFile(path.resolve(projectDir, '.env')),
    ...parseEnvFile(path.resolve(projectDir, '.env.local')),
  }

  // Shell environment takes precedence; file supplies missing credentials
  const url = (env.TURSO_DATABASE_URL && env.TURSO_DATABASE_URL.trim()) || fileEnv.TURSO_DATABASE_URL || 'file:local.db'
  const isRemote = url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://')
  const authToken = (env.TURSO_AUTH_TOKEN && env.TURSO_AUTH_TOKEN.trim()) || fileEnv.TURSO_AUTH_TOKEN || undefined

  if (isRemote && !authToken) {
    throw new Error(
      `TURSO_AUTH_TOKEN is required when using remote Turso database (${url}). ` +
      `Check your .env.local file or set TURSO_AUTH_TOKEN in your environment.`
    )
  }

  return { url, authToken, isRemote }
}
