// Ensures the single business row (id = 1) exists so /settings always has a
// record to edit. Idempotent — safe to run repeatedly. Uses raw SQL so it does
// not depend on how Node resolves the ESM lib/ modules.
//
//   npm run db:seed            (defaults to file:local.db)
//   TURSO_DATABASE_URL=... npm run db:seed   (remote)
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL || 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN || undefined
const client = createClient({ url, authToken })

const now = new Date().toISOString()

await client.execute({
  sql: `
    INSERT INTO business
      (id, name, email, phone, address, logo,
       bank_name, account_number, account_name,
       tax_rate, invoice_prefix, receipt_prefix,
       next_invoice_number, next_receipt_number, updated_at)
    VALUES
      (1, '', '', '', '', '',
       '', '', '',
       0, 'INV', 'RCPT',
       1, 1, ?)
    ON CONFLICT(id) DO NOTHING
  `,
  args: [now],
})

const { rows } = await client.execute('SELECT id, name FROM business WHERE id = 1')
console.log(
  rows.length
    ? `✓ business row ready (id=1, name=${JSON.stringify(rows[0].name)})`
    : '✗ failed to create business row'
)
process.exit(0)
