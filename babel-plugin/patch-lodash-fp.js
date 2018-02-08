const NO_CAP = [
  'dropRightWhile',
  'dropWhile',
  'every',
  'filter',
  'find',
  'findFrom',
  'findIndex',
  'findIndexFrom',
  'findKey',
  'findLast',
  'findLastFrom',
  'findLastIndex',
  'findLastIndexFrom',
  'findLastKey',
  'flatMap',
  'flatMapDeep',
  'flatMapDepth',
  'forEach',
  'forEachRight',
  'forIn',
  'forInRight',
  'forOwn',
  'forOwnRight',
  'map',
  'mapKeys',
  'mapValues',
  'partition',
  'reject',
  'remove',
  'some',
  'takeRightWhile',
  'takeWhile',
  'times'
]
const RE_ARG = [
  'gt',
  'gte',
  'lt',
  'lte',
  'concat'
]

module.exports = function({ types: t }) {
  const addConvert = (path, name, node) => {
    let arg
    if (NO_CAP.includes(name)) {
      arg = t.objectExpression([
        t.objectProperty(t.identifier('cap'), t.booleanLiteral(false))
      ])
    } else if (RE_ARG.includes(name)) {
      arg = t.objectExpression([
        t.objectProperty(t.identifier('rearg'), t.booleanLiteral(true))
      ])
    }

    if (!arg) return

    const left = t.identifier(name)
    const right = t.callExpression(
      t.memberExpression(t.identifier('_' + name), t.identifier('convert')), [arg]
    )
    path.insertAfter(
      t.variableDeclaration('const', [t.variableDeclarator(left, right)])
    )

    node.local.name = '_' + name
  }
  return {
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source && path.node.source.value.indexOf('lodash/fp') === 0) {
          for (const node of path.node.specifiers) {
            const name = node.imported.name
            addConvert(path, name, node)
          }
        }
      }
    }
  }
}