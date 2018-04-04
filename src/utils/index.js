import { reverse } from 'lodash/fp'
import { getType, getSnapshot, getParent, hasParent, walk, getMembers, getPathParts } from 'mobx-state-tree'


export const getTree = (model) => {
  let list = []

  walk(model, (node) => {
    if (getType(node).name === 'object') return
    list.push({
      ...getMembers(node),
      path: getPathParts(node)
    })
  })

  return reverse(list)
}

export const closest = (node, depth = 1) => {
  let tmp = node
  while(hasParent(getParent(tmp), depth)) {
    tmp = getParent(tmp)
  }
  return tmp
}

export const asReducer = (instance) => {
  return (state = {}, patch = {}) => {
    if (patch.op && patch.path) {
      if (instance.getSnapshot) {
        return instance.getSnapshot()
      }
      return getSnapshot(instance)
    }
    return state
  }
}

// export const asReducer = (instance) => {
//   return (state, patch = {}) => {
//     // if (state) applySnapshot(instance, state)
//     if (patch && patch.op && patch.path)
//       applyPatch(instance, patch)
//     return getSnapshot(instance)
//   }
// }