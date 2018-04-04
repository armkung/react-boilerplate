import { reverse } from 'lodash/fp'
import { getType, getSnapshot, getParent, hasParent, walk, getMembers, getPathParts } from 'mobx-state-tree'

// export const traverse = (predicate = R.always(true), map = R.identity) => (value, keys = [], initValue = []) => R.when(
//   R.either(R.is(Array), R.is(Object)),
//   R.pipe(
//     R.toPairs,
//     R.map(([key, value]) => {
//       const mappedValue = map(value)
//       const path = keys.concat(key)
//       if(predicate(mappedValue, key)) {
//         initValue.push([path, mappedValue])
//       }
//       traverse(predicate, map)(mappedValue, path, initValue)
//     }),
//     R.always(initValue)
//   )
// )(value)


// const traverse = (map = R.identity, fn = (value, path, list) => R.append([path, value], list), result = []) => {
//   return function reduce(value, keys = []) {
//       return R.when(
//         R.either(R.is(Array), R.is(Object)),
//         R.pipe(
//           R.toPairs,
//           R.map(([key, value]) => {
//             const mappedValue = map(value)
//             const path = keys.concat(key)
//             result = fn(mappedValue, path, result)
            
//             reduce(mappedValue, path)
//           }),
//           () => result
//          )
//       )(value)
//   }
// }


// const traverse = (map = R.identity, fn = (value, path, list) => R.append([path, value], list), initValue = []) => {
//   let result = initValue
//   let keys = []
//   const reduce = R.when(
//     R.either(R.is(Array), R.is(Object)),
//     R.pipe(
//       R.toPairs,
//       R.map(([key, value]) => {
//         path = keys.concat(key)
        
//         const mappedValue = map(value)
//         result = fn(mappedValue, path, result)
//         reduce(mappedValue)
//       }),
//       () => result
//      )
//   )
  
//   return reduce
// }


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
  while(hasParent(tmp, depth)) {
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