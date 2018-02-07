import * as fp from 'lodash/fp'

// no curry
export const ifElse = (predicate, whenTrueFn, whenFalseFn) => (...args) => {
  return predicate(...args) ? whenTrueFn(...args) : whenFalseFn(...args)
}

export const when = (predicate, whenTrueFn) => (...args) => {
  return ifElse(predicate, whenTrueFn, fp.identity)(...args)
}

export const applyTo = (...args) => (fn) => fp.apply(fn)(fp.flatten(args))

export const traverse = (transform = fp.identity, fn = (value, path, obj) => fp.set(path, value, obj), result = {}) => {
  return function reduce(acc, keys = []) {
      return when(
        fp.overSome([fp.isArray, fp.isPlainObject]),
        fp.pipe(
          fp.toPairs,
          fp.map(([key, value]) => {
            const path = keys.concat(key)
            const mappedValue = transform(value, path, fp.get(key, acc), result)
            result = fn(mappedValue, path, result)
            
            reduce(mappedValue, path)
          }),
          () => result
         )
      )(acc)
  }
}

// curry
export * from 'lodash/fp'

export const dropRightWhileWithKey = fp.dropRightWhile.convert({ cap: false })
export const dropWhileWithKey = fp.dropWhile.convert({ cap: false })
export const everyWithKey = fp.every.convert({ cap: false })
export const filterWithKey = fp.filter.convert({ cap: false })
export const findWithKey = fp.find.convert({ cap: false })
export const findFromWithKey = fp.findFrom.convert({ cap: false })
export const findIndexWithKey = fp.findIndex.convert({ cap: false })
export const findIndexFromWithKey = fp.findIndexFrom.convert({ cap: false })
export const findKeyWithKey = fp.findKey.convert({ cap: false })
export const findLastWithKey = fp.findLast.convert({ cap: false })
export const findLastFromWithKey = fp.findLastFrom.convert({ cap: false })
export const findLastIndexWithKey = fp.findLastIndex.convert({ cap: false })
export const findLastIndexFromWithKey = fp.findLastIndexFrom.convert({ cap: false })
export const findLastKeyWithKey = fp.findLastKey.convert({ cap: false })
export const flatMapWithKey = fp.flatMap.convert({ cap: false })
export const flatMapDeepWithKey = fp.flatMapDeep.convert({ cap: false })
export const flatMapDepthWithKey = fp.flatMapDepth.convert({ cap: false })
export const forEachWithKey = fp.forEach.convert({ cap: false })
export const forEachRightWithKey = fp.forEachRight.convert({ cap: false })
export const forInWithKey = fp.forIn.convert({ cap: false })
export const forInRightWithKey = fp.forInRight.convert({ cap: false })
export const forOwnWithKey = fp.forOwn.convert({ cap: false })
export const forOwnRightWithKey = fp.forOwnRight.convert({ cap: false })
export const mapWithKey = fp.map.convert({ cap: false })
export const mapKeysWithKey = fp.mapKeys.convert({ cap: false })
export const mapValuesWithKey = fp.mapValues.convert({ cap: false })
export const partitionWithKey = fp.partition.convert({ cap: false })
export const rejectWithKey = fp.reject.convert({ cap: false })
export const removeWithKey = fp.remove.convert({ cap: false })
export const someWithKey = fp.some.convert({ cap: false })
export const takeRightWhileWithKey = fp.takeRightWhile.convert({ cap: false })
export const takeWhileWithKey = fp.takeWhile.convert({ cap: false })
export const timesWithKey = fp.times.convert({ cap: false })

export const concatWith = fp.concat.convert({ rearg: true })

export const is = fp.curry(function is(constructor, value) {
  /* istanbul ignore next */
  return value != null && value.constructor === constructor || value instanceof constructor
})

export const evolve = fp.curry(function evolve(transformations, object) {
  let result = {}
  let transformation, key, type
  for (key in object) {
    transformation = transformations[key]
    type = typeof transformation
    /* istanbul ignore next */
    result[key] = type === 'function'                 ? transformation(object[key])
                : transformation && type === 'object' ? evolve(transformation, object[key])
                                                      : object[key]
  }
  return result
})

export const applySpec = fp.curry((destObj, srcObj) => fp.mapValues(
  ifElse(
    fp.isFunction,
    applyTo(srcObj),
    fp.identity
  ),
  destObj
))

export const append = fp.curry((elem, list) => fp.concat(list, [elem]))

export const prepend = fp.curry((elem, list) => fp.concat([elem], list))

export const objOf = fp.curry((key, value) => fp.set(key, value, {}))
