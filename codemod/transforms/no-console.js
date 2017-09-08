import { eslint, options } from './utils'

export default function transformer(file, api) {
  if (eslint.isPathIgnored(file.path)) {
    return file.source
  }

  const j = api.jscodeshift
  const root = j(file.source)
  root.find(j.CallExpression, {
    callee: {
      object: {
        name: 'console'
      },
      property: {
        name: 'log'
      }
    }
  }).forEach(p => {
    j(p).remove()
  })

  return root.toSource(options)
}