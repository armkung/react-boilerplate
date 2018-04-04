import { reject, flatten, isEmpty, update, pickBy, every, uniq, mergeWith, isArray, isFunction, mapValues, pipe, map, getOr, pick, filter, isNil } from 'lodash/fp'

const merge = mergeWith((srcValue, destValue) => {
  if (isArray(srcValue)) {
    return uniq(srcValue.concat(destValue))
  }
})

export const REQUIRED = 'required'
export const ERROR = 'error'
export const WARNING = 'warning'
export const INFO = 'info'
export const INVALID_TYPES = [
  REQUIRED,
  ERROR,
  WARNING
]

export const createValidation = (ruleSpecs) => {
  const allow = getOr(() => true, 'allow')(ruleSpecs)
  const getMessages = (dependencies) => pipe(
    reject(({ type }) => dependencies.required === false && type === REQUIRED),
    filter(({ rule }) => {
      const { value } = dependencies
      const isInvalid = !rule(value, dependencies)
  
      return isInvalid
    }),
    map(
      pipe(
        pick(['type', 'message']),
        update('message', (message) =>
          isFunction(message) ? message(dependencies.value, dependencies) : message
        )
      )
    ),
  )(ruleSpecs)

  const isValid = pipe(
    getMessages,
    reject(['type', INFO]),
    isEmpty
  )

  return {
    allow,
    getMessages,
    isValid
  }
}

export const createValidator = (validationSpecs) => (fieldId) => {
  const selectedValidation = pickBy(
    (value, key) => {
      if (isNil(fieldId)) {
        return false
      }
      return new RegExp(key).test(fieldId)
    }
  )(validationSpecs)

  const allow = (value) => every(
    ({ allow }) => allow(value)
  )(selectedValidation)

  const getValidationMessages = (dependencies = {}) => pipe(
    map(({ getMessages }) => getMessages({ id: fieldId, ...dependencies })),
    flatten,
  )(selectedValidation)

  const isValid = (dependencies = {}) => every(
    ({ isValid }) => isValid({ id: fieldId, ...dependencies })
  )(selectedValidation)

  return {
    allow,
    getValidationMessages,
    isValid
  }
}