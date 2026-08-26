// Env-driven so the same config works for a local file (dev) and Turso (prod).
// drizzle-kit bundles this file, so `export default` is fine in a CJS project.
/** @type {import('drizzle-kit').Config} */
export default {
  schema: './lib/schema.js',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  verbose: true,
  strict: true,
}
