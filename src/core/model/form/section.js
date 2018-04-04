import { mapValues, pipe, split, first, keyBy } from 'lodash/fp'
import { types, getSnapshot, applySnapshot } from 'mobx-state-tree'

import { Fields, createFields } from './field'

const getPageId = pipe(
  split('_'),
  first
)

export const Sections = types.model('sections', {})
  
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
  .views((self) => ({
    getField: (fieldId) => {
      return self.fields[fieldId]
    },
    getFieldValue: (fieldId) => {
      return self.fields[fieldId].value
    }
  }))
  .actions((self) => ({
    postProcessSnapshot: ({ hidden, ...snapshot }) => hidden ? undefined : snapshot,
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

export const createSection = ({ section, fields, ...args }) => section
  .props({
    id: section.name,
    fields: createFields(fields)
  })
  .volatile(() => args)

export const createSections = pipe(
  keyBy('section.name'),
  mapValues(createSection),
  mapValues((section) => types.optional(section, {})),
  (sections) => types.optional(Sections.props(sections), {})
)