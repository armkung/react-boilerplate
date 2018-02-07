import { getSnapshot, getParent, isRoot } from 'mobx-state-tree'

export const closest = (node) => {
  let tmp = node
  while(!isRoot(getParent(tmp))) {
    tmp = getParent(tmp)
  }
  return tmp
}

export const asReducer = (instance) => {
  return (state = {}, patch = {}) => {
    if (patch.op && patch.path) return getSnapshot(instance)
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