import { flow, split, first, omitBy, isNil } from 'lodash/fp'
import { types } from 'mobx-state-tree'

const getPageId = flow(
  split('_'),
  first
)

export const Fields = types
  .model('fields', {})
  .actions((self) => ({
    postProcessSnapshot: omitBy(isNil),
    setFieldValue: (fieldId, value) => {
      if (self[fieldId]) {
        self[fieldId].setValue(value)
      }
    }
  }))

export const Section = types
  .model('section', {
    id: types.string,
    fields: Fields,
    hidden: false
  })
  .volatile((self) => ({
    label: '',
    pageId: getPageId(self.id)
  }))
  .actions((self) => ({
    postProcessSnapshot: ({ hidden, ...snapshot }) => hidden ? undefined : snapshot,
    hide: () => {
      self.hidden = true
    },
    show: () => {
      self.hidden = false
    }
  }))