import { overSome, isEmpty, map, mapValues, groupBy, pipe, get, flatMap, isNil, values, omitBy } from 'lodash/fp'
import { getChildType, types, getSnapshot } from 'mobx-state-tree'

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
    flatMap(
      pipe(
        get('fields'),
        values,
      )
    )
  )
  const getPages = pipe(
    getSections,
    groupBy('pageId')
  )

  return {
    getField: (sectionId, fieldId) => self.sections[sectionId].fields[fieldId],
    getSection: (sectionId) => self.sections[sectionId],
    getPages: () => getPages(self),
    getSections: () => getSections(self),
    getFields: () => getFields(self),
    getSnapshot: () => getSnapshot(self)
  }
}

export const Form = types
  .model('form', {
    sections: Sections
  })
  .views(views)
  .actions(actions)