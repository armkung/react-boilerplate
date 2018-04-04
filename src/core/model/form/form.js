import { flow, flatten, map, groupBy, pipe, get, values } from 'lodash/fp'
import { types, getSnapshot } from 'mobx-state-tree'

import { Sections } from './section'

const actions = (self) => {
  return {
    setFieldValue: (section, fieldId, value) => {
      self.sections[section].fields[fieldId].setValue(value)
    }
  }
}

const views = (self) => {
  const getSections = pipe(
    get('sections'),
    values
  )
  const getFields = pipe(
    getSections,
    map(
      flow(
        get('fields'),
        values
      )
    ),
    flatten
  )
  const getPages = pipe(
    getSections,
    groupBy('pageId')
  )

  return {
    get allPages() {
      return getPages(self)
    },
    get allSections() {
      return getSections(self)
    },
    get allFields() {
      return getFields(self)
    },
    getField: (sectionId, fieldId) => self.sections[sectionId].fields[fieldId],
    getSection: (sectionId) => self.sections[sectionId],
    getSnapshot: () => getSnapshot(self)
  }
}

export const Form = types
  .model('form', {
    sections: Sections
  })
  .views(views)
  .actions(actions)