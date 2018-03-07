import { options } from './utils'
import { hasClosest } from './utils'

export default (file, api, { new: newName, old: oldName }) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const rename = (node, prop) => {
    if (node[prop] === oldName) {
      node[prop] = newName
    }
  }

  root.find(j.Property).forEach(({ node }) => rename(node.key, 'name'))

  root
    .find(j.Identifier)
    .filter(path => hasClosest([j.JSXExpressionContainer, j.MemberExpression], path))
    .forEach(({ node }) => rename(node, 'name'))
  
  root
    .find(j.Literal)
    .filter(path => hasClosest([j.CallExpression, j.MemberExpression], path))
    .forEach(({ node }) => rename(node, 'value'))

    


  return root.toSource(options)
}
