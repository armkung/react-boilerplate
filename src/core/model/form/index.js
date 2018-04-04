import { zipObject, set, assign, reduce, replace, split,omitBy, isNil, get, update, pipe, mapValues, keyBy, noop } from 'lodash/fp'

import { getTree } from 'utils'
import { Form } from './form'
import { createSections } from './section'

const fromSnapshot = (sections) => ({
  sections: mapValues(
    (fields, id) => ({
      id,
      fields: mapValues(
        (value, id) => ({
          id,
          value
        })
      )(fields)
    })
  )(sections)
})

const toSnapshot = pipe(
  get('sections'),
  omitBy(isNil),
  mapValues(
    pipe(
      get('fields'),
      omitBy(isNil),
      mapValues('value')
    )
  )
)

const getSnapshotSchema = pipe(
  getTree,
  reduce(
    (obj, { path, properties }) => {
      const value = mapValues(
        pipe(
          get('name'),
          replace(/[()]/g, ''),
          split(' | '),
          (type) => ({ type })
        )
      )(properties)

      return set(path, value, obj)
    },
    {}
  ),
  toSnapshot,
  mapValues(
    (properties) =>({
      type: 'object',
      properties
    })
  )
)

const getModel = (model) => pipe(
  getTree,
  reduce(
    (obj, { path, properties, volatile }) => {
      const value = pipe(
        assign(zipObject(volatile, volatile)),
        mapValues(
          (value, key) => get(path.concat(key), model)
        ),
      )(properties)

      return set(path, value, obj)
    },
    {}
  )
)(model)

export default ({ sections, services, afterCreate = noop, initialState = {} }) => Form
  .props({ sections: createSections(sections) })
  .preProcessSnapshot(fromSnapshot)
  .actions((self) => ({
    postProcessSnapshot: toSnapshot,
    afterCreate: () => afterCreate(self)
  }))
  .views((self) => ({
    getModel: () => getModel(self),
    getSnapshotSchema: () => getSnapshotSchema(self)
  }))
  .create(initialState, services)