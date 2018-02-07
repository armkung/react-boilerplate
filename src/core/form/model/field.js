import { types, getEnv, flow } from 'mobx-state-tree'
import { closest } from 'utils'

export const Field = types
  .model('field', {
    id: types.string,
    value: types.union(types.undefined, types.string, types.number),
    hidden: false
  })
  .actions((self) => ({
    postProcessSnapshot: ({ hidden, ...snapshot }) => hidden ? undefined : snapshot,
    afterAttach: () => {
      self.section = closest(self)
    },
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
    value: ''
  })

export const DropdownField = Field
  .props({
    value: types.maybe(
      types.model('option', {
        value: types.union(types.string, types.number)
      })
    )
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