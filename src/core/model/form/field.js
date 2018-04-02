import { types, getEnv, flow } from 'mobx-state-tree'
import { closest } from 'utils'

export const FieldValue = types.model('field_value', {
  value: types.union(types.string, types.number)
})

export const FieldOption = FieldValue.props({
  label: types.maybe(types.string)
})

export const Field = types
  .model('field', {
    id: types.string,
    value: types.maybe(FieldValue),
    hidden: false
  })
  .volatile(() => ({
    key: ''
  }))
  .actions((self) => ({
    // postProcessSnapshot: ({ hidden, ...snapshot }) => hidden ? undefined : snapshot,
    afterAttach: () => {
      self.section = closest(self)
      self.key = `${self.section.id}.${self.id}`
    },
    hide: () => {
      self.hidden = true
    },
    show: () => {
      self.hidden = false
    },
    setValue: (value) => {
      self.value.value = value
    }
  }))

export const TextField = Field
  .props({
    value: types.optional(FieldValue, { value: '' })
  })

export const DropdownField = Field
  .props({
    value: types.optional(FieldOption, { value: '', label: '' })
  })
  .volatile(() => ({
    options: []
  }))
  .actions((self) => ({
    afterAttach: flow(function*() {
      const { getData } = getEnv(self)
      self.options = yield getData()
      self.setValue(self.options[0])
    }),
    setValue: (value) => {
      self.value = value
    }
  }))