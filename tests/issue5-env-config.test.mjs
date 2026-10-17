import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getDbConfig, parseEnvFile } from '../lib/env-config.mjs'

function createEnvFixture(t, files = {}) {
  const tempParent = path.resolve(os.tmpdir())
  const projectDir = fs.mkdtempSync(path.join(tempParent, 'invoice-env-config-'))
  t.after(() => {
    const target = path.resolve(projectDir)
    if (path.dirname(target) !== tempParent || !path.basename(target).startsWith('invoice-env-config-')) {
      throw new Error('Refusing to clean an unexpected environment fixture path')
    }
    fs.rmSync(target, { recursive: true, force: true })
  })
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(projectDir, name), content)
  }
  return projectDir
}

test('Issue 5: shell overrides win and .env.local supplies missing credentials', (t) => {
  const projectDir = createEnvFixture(t, {
    '.env': 'TURSO_DATABASE_URL=libsql://base.turso.io\nTURSO_AUTH_TOKEN=base-token',
    '.env.local': 'TURSO_DATABASE_URL=libsql://local.turso.io\nTURSO_AUTH_TOKEN=local-token',
  })

  assert.deepEqual(getDbConfig({ env: {}, projectDir }), {
    url: 'libsql://local.turso.io', authToken: 'local-token', isRemote: true,
  })
  assert.deepEqual(getDbConfig({
    env: { TURSO_DATABASE_URL: 'libsql://shell.turso.io', TURSO_AUTH_TOKEN: 'shell-token' },
    projectDir,
  }), {
    url: 'libsql://shell.turso.io', authToken: 'shell-token', isRemote: true,
  })
  assert.deepEqual(getDbConfig({
    env: { TURSO_DATABASE_URL: 'libsql://shell.turso.io', TURSO_AUTH_TOKEN: '' },
    projectDir,
  }), {
    url: 'libsql://shell.turso.io', authToken: 'local-token', isRemote: true,
  })
  assert.equal(getDbConfig({
    env: { TURSO_DATABASE_URL: 'file:shell-override.db' }, projectDir,
  }).url, 'file:shell-override.db')
})

test('Issue 5: .env supplies values absent from .env.local', (t) => {
  const projectDir = createEnvFixture(t, {
    '.env': 'TURSO_DATABASE_URL=libsql://base.turso.io\nTURSO_AUTH_TOKEN=base-token',
    '.env.local': 'TURSO_DATABASE_URL=libsql://local.turso.io',
  })
  assert.deepEqual(getDbConfig({ env: {}, projectDir }), {
    url: 'libsql://local.turso.io', authToken: 'base-token', isRemote: true,
  })
})

test('Issue 5: missing remote credentials fail and absent configuration defaults locally', (t) => {
  const projectDir = createEnvFixture(t)
  assert.throws(
    () => getDbConfig({ env: { TURSO_DATABASE_URL: 'libsql://missing-token.turso.io' }, projectDir }),
    /TURSO_AUTH_TOKEN is required/,
  )
  assert.deepEqual(getDbConfig({ env: {}, projectDir }), {
    url: 'file:local.db', authToken: undefined, isRemote: false,
  })
})

test('Issue 5: export syntax, quoted values, and trailing comments follow dotenv syntax', (t) => {
  const projectDir = createEnvFixture(t, {
    '.env.local': [
      'export TURSO_DATABASE_URL="libsql://quoted.turso.io" # production',
      'export TURSO_AUTH_TOKEN="token#inside-quotes" # credential',
      "SINGLE_QUOTED='single#inside-quotes' # comment",
      'UNQUOTED=plain-value # comment',
    ].join('\n'),
  })
  assert.deepEqual(getDbConfig({ env: {}, projectDir }), {
    url: 'libsql://quoted.turso.io', authToken: 'token#inside-quotes', isRemote: true,
  })
  assert.deepEqual(parseEnvFile(path.join(projectDir, '.env.local')), {
    TURSO_DATABASE_URL: 'libsql://quoted.turso.io',
    TURSO_AUTH_TOKEN: 'token#inside-quotes',
    SINGLE_QUOTED: 'single#inside-quotes',
    UNQUOTED: 'plain-value',
  })
})

test('Issue 5: quoted multiline values and escaped newlines follow dotenv syntax', (t) => {
  const projectDir = createEnvFixture(t, {
    '.env.local': 'MULTILINE="first line\nsecond # line"\nESCAPED="first\\nsecond"\n',
  })
  assert.deepEqual(parseEnvFile(path.join(projectDir, '.env.local')), {
    MULTILINE: 'first line\nsecond # line',
    ESCAPED: 'first\nsecond',
  })
})

test('Issue 5: existing unreadable configuration fails instead of selecting a fallback database', (t) => {
  const projectDir = createEnvFixture(t, {
    '.env': 'TURSO_DATABASE_URL=file:must-not-fallback.db',
  })
  // A directory at the expected file path makes the read fail on Windows and Linux.
  const unreadablePath = path.join(projectDir, '.env.local')
  fs.mkdirSync(unreadablePath)
  assert.throws(
    () => getDbConfig({ env: {}, projectDir }),
    (error) => error.message.includes(unreadablePath) && error.cause instanceof Error,
  )
})
