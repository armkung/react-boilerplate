module.exports = function ({ types: t }) {
  let hasJSX = false
  return {
    visitor: {
      JSXOpeningElement() {
        hasJSX = true
      },
      Program(path) {
        if (!hasJSX || path.scope.hasBinding('React')) {
          return
        }

        const reactImport = t.importDeclaration([
          t.importDefaultSpecifier(t.identifier('React'))
        ], t.stringLiteral('react'))

        path.node.body.unshift(reactImport)
      }
    }
  }
}