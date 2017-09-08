import { eslint, options } from './utils'
import { initUnusedVars, closest } from './utils'

export default (file, api) => {
  if (eslint.isPathIgnored(file.path)) {
    return file.source
  }

  const j = api.jscodeshift

  const removeDeclarator = declarator => {
    // each declarator is contained by a declaration, which MAY have more than
    // one declarator. If it doesn't, take out the whole declaration. Otherwise,
    // just prune our declarator
    const declaration = closest(j.VariableDeclaration, declarator)
    if (declaration.node.declarations.length === 1) {
      declaration.prune()
    } else {
      declarator.prune()
    }
  }

  const { program, unusedVars } = initUnusedVars(j, file.path, file.source)
  if (!program) return file.source

  unusedVars.forEach(({ path, message }) => {
    if (!path) return

    const declarator = closest([
      j.VariableDeclarator
    ], path)

    if (!declarator) return

    const declaration = closest([
      j.VariableDeclaration
    ], declarator)

    let parent = declaration.node.declarations[0].id

    if (declarator.node.id.type === 'ArrayPattern') {
      parent = declarator.node.id.elements[0]
    }

    const properties = parent.properties

    if (properties && properties.length > 1) {
      const matchs = message.message.match(/'(.*?)'/)

      const filterdProperties = properties
        .filter((property) => property.key.name === matchs[1] || property.value.name === matchs[1])

      if (properties.length === filterdProperties.length) {
        declarator.prune()
      }

      parent.properties = properties
        .filter((property) => {
          if (property.key.name === matchs[1] || property.value.name === matchs[1]) {
            return false
          }
          return true
        })
    } else {
      removeDeclarator(declarator)
      program
        .find(j.AssignmentExpression)
        .filter((id) => id.node.left.name === declarator.node.id.name)
        .forEach((id) => {
          id.parent.prune()
        })
    }

  })

  return program.toSource(options)
}