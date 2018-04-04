import { noop, some, keyBy, mapValues, pipe } from 'lodash/fp'
import { types, getEnv, flow } from 'mobx-state-tree'

import { closest } from 'utils'
import { createValidation, REQUIRED } from 'core/service/validation'


export const FieldValue = types.model('object', {
  value: types.union(types.string, types.number),
  label: types.maybe(types.string)
})

export const Fields = types.model('fields', {})

export const Field = types
  .model('field', {
    id: types.string,
    value: types.maybe(FieldValue),
    hidden: false
  })
  .volatile(() => ({
    key: '',
    validationMessages: []
  }))
  .actions((self) => ({
    postProcessSnapshot: ({ hidden, ...snapshot }) =>  hidden ? undefined : snapshot,
    hide: () => {
      self.hidden = true
    },
    show: () => {
      self.hidden = false
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
    afterAttach: flow(function*() {
      const { getData } = getEnv(self)
      self.options = yield getData()
      self.setValue(self.options[0])
    })
  }))


export const createField = ({ field, validation = [], afterAttach = noop, ...args }) => {
  const validator = createValidation(validation)
  const required = some(['type', REQUIRED], validation)

  return field
    .props({
      id: field.name
    })
    .volatile(() => ({
      required,
      ...args
    }))
    .actions((self) => ({
      afterAttach: () => {
        self.section = closest(self, 2)
        self.key = `${self.section.id}.${self.id}`
        afterAttach(self)
      },
      setValue: (value) => {
        self.value = value
        self.validationMessages = validator.getMessages(self)
      }
    }))
}

export const createFields = pipe(
  keyBy('field.name'),
  mapValues(createField),
  mapValues((field) => types.optional(field, {})),
  (fields) => types.optional(Fields.props(fields), {})
)