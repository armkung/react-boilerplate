import { isEqual, mapValues, groupBy, flow, get, flatMap, isNil, values, omitBy } from 'lodash/fp'
import { types, getSnapshot } from 'mobx-state-tree'

const actions = (self) => {
  return {
    postProcessSnapshot: omitBy(isNil),
    setFieldValue: (section, fieldId, value) => {
      if (self[section].fields[fieldId]) {
        self[section].fields[fieldId].setValue(value)
      }
    }
  }
}

const views = (self) => {
  const getFields = flow(
    values,
    flatMap(
      flow(
        get('fields'),
        values,
      )
    ),
  )
  const getPages = flow(
    values,
    groupBy('pageId')
  )

  const removeHidden = omitBy(
    flow(
      get('hidden'),
      isEqual(true)
    )
  )

  return {
    getPages: () => getPages(self),
    getFields: () => getFields(self),
    getSnapshot: () => flow(
      getSnapshot,
      removeHidden,
      mapValues(
        flow(
          get('fields'),
          mapValues(
            flow(
              removeHidden,
              get('value')
            )
          )
        )
      )
    )(self)
  }
}

export const Form = types
  .model('form', {})
  .views(views)
  .actions(actions)