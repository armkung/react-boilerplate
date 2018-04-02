import { reject, isEqual, flatMap, isEmpty, reduce, compact, pickBy, every, uniq, mergeWith, isArray, isFunction, mapValues, flow, map, getOr, pick, filter, isNil } from 'lodash/fp'

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

export const checkRule = (dependencies = {}) => flow(
  filter(({ rule }) => {
    const { value } = dependencies
    const isInvalid = !rule(value, dependencies)

    return isInvalid
  }),
  map('message'),
  map((message) => isFunction(message) ? message(dependencies.value, dependencies) : message)
)

export const createValidation = (ruleSpecs) => {
  const allow = getOr(() => true, 'allow')(ruleSpecs)
  const getMessages = (dependencies) => flow(
    pick(compact([
      dependencies.required && REQUIRED,
      ERROR,
      WARNING,
      INFO
    ])),
    mapValues(checkRule(dependencies))
  )(ruleSpecs)

  return {
    allow,
    getMessages
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
    ({ allow }) => allow(value),
  )(selectedValidation)

  const getValidationMessages = (dependencies = {}) => flow(
    reduce((messages, { getMessages }) => merge(
      messages,
      getMessages({ id: fieldId, ...dependencies })
    ), {}),
    flatMap((messages, type) =>
      map((message) => ({ type, message }), messages)
    )
  )(selectedValidation)


  const isValid = flow(
    getValidationMessages,
    reject(({ type }) => isEqual(type, INFO)),
    isEmpty
  )

  return {
    allow,
    getValidationMessages,
    isValid
  }
}