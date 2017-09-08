import prettier from 'prettier'

import { eslint, options, closest } from './utils'

const FUNCTION_NAME = [/^flow$/]

export default (file, api) => {
  if (eslint.isPathIgnored(file.path)) {
    return file.source
  }

  const j = api.jscodeshift

  const filterComposeFn = (node) => {
    const callee = node.node.callee
    if (callee) {
      return FUNCTION_NAME.some((regx) => regx.test(callee.name))
    }
    return false
  }

  let source = j(file.source).toSource(options)

  const breakLine = (node) => {
    const first = node.arguments[0]
    const last = node.arguments[node.arguments.length - 1]
    source = prettier.format(source, {
      printWidth: node.loc.end.column - 1,
      semi: false,
      singleQuote: true,
      rangeStart: first.start,
      rangeEnd: last.end
    })
  }

  let prev
  while (true) {
    const exp = j(source)
      .find(j.CallExpression)
      .filter(filterComposeFn)
      .filter(
        (node) => (
          node.node.loc &&
          node.node.loc.start.line === node.node.loc.end.line
        )
      )
      .paths()[0]

    if (!exp) {
      break
    }
    if (prev && exp.node.loc.start.line === prev.node.loc.start.line) {
      break
    }
    if (exp.node && exp.node.arguments.length > 0) {
      prev = exp

      const exportDeclaration = closest([
        j.ExportNamedDeclaration
      ], exp)

      if (!exportDeclaration) {
        breakLine(exp.node)
      }
    }
  }

  return source
}