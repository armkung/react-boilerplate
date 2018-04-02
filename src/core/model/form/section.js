import { flow, split, first, omitBy, isNil } from 'lodash/fp'
import { types, getSnapshot, applySnapshot } from 'mobx-state-tree'

const getPageId = flow(
  split('_'),
  first
)

export const Fields = types
  .model('fields', {})
  .actions((self) => ({
    postProcessSnapshot: omitBy(isNil)
  }))

export const Section = types
  .model('section', {
    id: types.string,
    fields: Fields,
    hidden: false
  })
  .volatile((self) => ({
    prevSnapshot: null,
    pageId: getPageId(self.id)
  }))
  .actions((self) => ({
    // postProcessSnapshot: ({ hidden, ...snapshot }) => hidden ? undefined : snapshot,
    save: () => {
      self.prevSnapshot = getSnapshot(self)
    },
    load: () => {
      if (self.prevSnapshot) {
        applySnapshot(self, self.prevSnapshot)
      }
    },
    setFieldValue: (fieldId, value) => {
      if (self.fields[fieldId]) {
        self.fields[fieldId].setValue(value)
      }
    },
    hide: () => {
      self.hidden = true
    },
    show: () => {
      self.hidden = false
    }
  }))