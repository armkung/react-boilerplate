import { eslint, options } from './utils'
import { initUnusedVars, closest } from './utils'

export default (file, api) => {
  if (eslint.isPathIgnored(file.path)) {
    return file.source
  }

  const j = api.jscodeshift

  const { program, unusedVars } = initUnusedVars(j, file.path, file.source)
  if (!unusedVars) return file.source

  unusedVars.forEach(({ path }) => {
    const declaration = closest([
      j.ImportDeclaration
    ], path)
    if (!declaration) {
      return
    }

    // specifiers include the default import, and the named imports
    declaration.node.specifiers = declaration.node.specifiers.filter(spec => {
      if (j.ImportDefaultSpecifier.check(spec)) {
        if (spec.local === path.node) {
          return false
        }
        return true
      }

      // ImportSpecifier is only other option
      if (spec.local === path.node) {
        return false
      }

      return true
    })

    if (!declaration.node.specifiers.length) {
      declaration.prune()
    }
  })

  return program.toSource(options)
}