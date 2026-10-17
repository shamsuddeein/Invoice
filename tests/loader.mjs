import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

// Node 20 does not infer ESM from .js syntax. Limit the override to the app's
// ESM sources so dependency packages and CommonJS build configs keep their format.
export async function load(url, context, nextLoad) {
  if (url.startsWith('file:')) {
    const relative = path.relative(projectRoot, fileURLToPath(url)).replaceAll('\\', '/')
    if (
      relative.endsWith('.js') &&
      (relative === 'auth.config.js' || /^(app|lib|hooks)\//.test(relative) || relative === 'components/invoice-doc/theme.js')
    ) {
      return nextLoad(url, { ...context, format: 'module' })
    }
  }
  return nextLoad(url, context)
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('next/') && !specifier.endsWith('.js')) {
    return nextResolve(specifier + '.js', context)
  }
  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2)
    const fullPath = path.resolve(process.cwd(), relativePath)
    let target = fullPath
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      if (fs.existsSync(target + '.js')) {
        target = target + '.js'
      } else if (fs.existsSync(target + '.mjs')) {
        target = target + '.mjs'
      } else if (fs.existsSync(target + '.jsx')) {
        target = target + '.jsx'
      } else if (fs.existsSync(path.join(target, 'index.js'))) {
        target = path.join(target, 'index.js')
      }
    }
    return nextResolve(pathToFileURL(target).href, context)
  }
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    if (context.parentURL && context.parentURL.startsWith('file:')) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL))
      const fullPath = path.resolve(parentDir, specifier)
      if (!fs.existsSync(fullPath) || (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory())) {
        if (fs.existsSync(fullPath + '.js')) {
          return nextResolve(pathToFileURL(fullPath + '.js').href, context)
        }
        if (fs.existsSync(fullPath + '.mjs')) {
          return nextResolve(pathToFileURL(fullPath + '.mjs').href, context)
        }
        if (fs.existsSync(fullPath + '.jsx')) {
          return nextResolve(pathToFileURL(fullPath + '.jsx').href, context)
        }
        if (fs.existsSync(path.join(fullPath, 'index.js'))) {
          return nextResolve(pathToFileURL(path.join(fullPath, 'index.js')).href, context)
        }
      }
    }
  }
  return nextResolve(specifier, context)
}
