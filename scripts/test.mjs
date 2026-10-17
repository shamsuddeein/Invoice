import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))

function testFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return testFiles(fullPath)
    return entry.name.endsWith('.test.mjs') ? [fullPath] : []
  }).sort()
}

// Expand test paths ourselves; Windows shells and Node 20 do not expand globs.
const result = spawnSync(process.execPath, [
  '--no-warnings',
  '--import', new URL('../tests/register.mjs', import.meta.url).href,
  '--test',
  ...process.argv.slice(2),
  ...testFiles(path.join(root, 'tests')),
], { cwd: root, stdio: 'inherit' })

if (result.error) console.error(result.error.message)
process.exitCode = result.status ?? 1
