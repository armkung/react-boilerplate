import { types, getEnv, flow, getPathParts } from 'mobx-state-tree'

export const Field = types
  .model('field', {
    id: types.string,
    value: types.union(types.undefined, types.string, types.number),
    hidden: false
  })
  .volatile(() => ({
    sectionId: '',
    label: ''
  }))
  .actions((self) => ({
    postProcessSnapshot: ({ hidden, ...snapshot }) => hidden ? undefined : snapshot,
    afterAttach: () => {
      const [sectionId] = getPathParts(self)
      self.sectionId = sectionId
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

export const DropdownField = Field
  .volatile(() => ({
    options: []
  }))
  .props({
    value: types.maybe(
      types.model('option', {
        value: types.union(types.string, types.number)
      })
    )
  })
  .actions((self) => ({
    afterAttach: flow(function*() {
      const { getData } = getEnv(self)
      self.options = yield getData()
      self.setValue(self.options[0])
    })
  }))