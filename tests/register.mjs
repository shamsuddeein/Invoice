import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// Application imports create their default DB client before fixture injection.
// Always isolate that client, even when the shell contains production settings.
process.env.NODE_ENV = 'test'
process.env.TURSO_DATABASE_URL = 'file::memory:'
process.env.TURSO_AUTH_TOKEN = ''
process.env.AUTH_SECRET = 'synthetic-test-secret-only'
process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET
process.env.OWNER_USERNAME = 'test-owner'
process.env.OWNER_PASSWORD = 'synthetic-test-password-only'

register('./tests/loader.mjs', pathToFileURL('./'))
