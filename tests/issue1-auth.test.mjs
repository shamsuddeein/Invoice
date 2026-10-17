import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword } from '../lib/password.js'
import { authorizeUser } from '../lib/auth.js'

function createMockDb(rowsOrError) {
  return {
    select: () => ({
      from: () => ({
        where: async () => {
          if (rowsOrError instanceof Error) throw rowsOrError
          return rowsOrError
        },
      }),
    }),
  }
}

test('Issue 1: First-run bootstrap authentication when app_auth is empty', async () => {
  const mockDb = createMockDb([])
  const env = { OWNER_USERNAME: 'admin', OWNER_PASSWORD: 'bootstrap_pass_123' }

  const result = await authorizeUser(
    { username: 'admin', password: 'bootstrap_pass_123' },
    null,
    { dbClient: mockDb, env }
  )
  assert.deepEqual(result, { id: '1', name: 'admin' })

  const wrongPass = await authorizeUser(
    { username: 'admin', password: 'wrong_pass' },
    null,
    { dbClient: mockDb, env }
  )
  assert.equal(wrongPass, null)
})

test('Issue 1: Authenticates with changed stored password and rejects old bootstrap password', async () => {
  const newHash = hashPassword('new_secure_pass_456')
  const mockDb = createMockDb([{ passwordHash: newHash }])
  const env = { OWNER_USERNAME: 'admin', OWNER_PASSWORD: 'bootstrap_pass_123' }

  // New password succeeds
  const newResult = await authorizeUser(
    { username: 'admin', password: 'new_secure_pass_456' },
    null,
    { dbClient: mockDb, env }
  )
  assert.deepEqual(newResult, { id: '1', name: 'admin' })

  // Old bootstrap password is now rejected
  const oldResult = await authorizeUser(
    { username: 'admin', password: 'bootstrap_pass_123' },
    null,
    { dbClient: mockDb, env }
  )
  assert.equal(oldResult, null)
})

test('Issue 1: Transient database failure rejects authentication and does NOT fall back to bootstrap password', async () => {
  const failingDb = createMockDb(new Error('Connection timeout / DB unreachable'))
  const env = { OWNER_USERNAME: 'admin', OWNER_PASSWORD: 'bootstrap_pass_123' }

  // Old bootstrap password MUST be rejected on DB error
  const bootstrapAttempt = await authorizeUser(
    { username: 'admin', password: 'bootstrap_pass_123' },
    null,
    { dbClient: failingDb, env }
  )
  assert.equal(bootstrapAttempt, null, 'Bootstrap password must not be reactivated on DB error')

  // Even new password attempt cannot authenticate when DB fails
  const newPassAttempt = await authorizeUser(
    { username: 'admin', password: 'new_secure_pass_456' },
    null,
    { dbClient: failingDb, env }
  )
  assert.equal(newPassAttempt, null, 'Auth must be rejected when DB cannot be reached')
})

test('Issue 1: Missing table error rejects authentication rather than treating as bootstrap permission', async () => {
  const missingTableDb = createMockDb(new Error('no such table: app_auth'))
  const env = { OWNER_USERNAME: 'admin', OWNER_PASSWORD: 'bootstrap_pass_123' }

  const attempt = await authorizeUser(
    { username: 'admin', password: 'bootstrap_pass_123' },
    null,
    { dbClient: missingTableDb, env }
  )
  assert.equal(attempt, null, 'Missing table must reject auth and require migration/setup')
})
