import { find, noop, some, keyBy, mapValues, pipe } from 'lodash/fp'
import { types, getEnv, flow, addDisposer, onPatch } from 'mobx-state-tree'

import { closest } from 'utils'
import { createValidation, REQUIRED } from 'core/service/validation'


export const FieldValue = types.model('object', {
  value: types.union(types.string, types.number),
  label: types.maybe(types.string)
})

export const Fields = types.model('fields', {})

export const Field = types
  .model('field', {
    id: types.identifier(),
    value: types.maybe(types.union(types.string, types.number, FieldValue)),
    hidden: false
  })
  .views((self) => ({
    get section() {
      return closest(self, 3)
    }
  }))
  .actions((self) => ({
    postProcessSnapshot: ({ hidden, ...snapshot }) =>  hidden ? undefined : snapshot,
    hide: () => {
      self.hidden = true
    },
    show: () => {
      self.hidden = false
    },
    setValue: (value) => {
      self.value = value
    }
  }))

export const TextField = Field
  .props({
    value: types.optional(types.string, '')
  })

export const DropdownField = Field
  .props({
    value: types.optional(FieldValue, { value: '', label: null })
  })
  .volatile(() => ({
    options: []
  }))
  .actions((self) => ({
    setValue: (value) => {
      self.value = find(['value', value], self.options)
    },
    afterAttach: flow(function*() {
      const { getData } = getEnv(self)
      self.options = yield getData()
      self.value = self.options[0]
    })
  }))


export const createField = ({ sectionId, field, validation = [], afterAttach = noop, ...args }) => {
  const validator = createValidation(validation)
  const required = some(['type', REQUIRED], validation)

  return field
    .props({
      id: types.optional(types.identifier(), `${sectionId}.${field.name}`)
    })
    .volatile(() => ({
      required,
      ...args
    }))
    .views((self) => ({
      get validationMessages() {
        return validator.getMessages(self)
      }
    }))
    .actions((self) => ({
      afterAttach: () => afterAttach(self)
    }))
}

export const createFields = pipe(
  keyBy('field.name'),
  mapValues(createField),
  mapValues((field) => types.optional(field, {})),
  (fields) => types.optional(Fields.props(fields), {})
)