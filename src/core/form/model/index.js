import { update, flow, mapValues, keyBy } from 'lodash/fp'

import { Form } from './form'
import { Section, Fields } from './section'

const toModel = flow(
  keyBy('id'),
  mapValues(
    ({ id, fields, ...args }) => Section
    .props({
      id,
      fields: Fields.props(keyBy('name', fields))
    })
    .volatile(() => args)
  )
)
const toState = flow(
  keyBy('id'),
  mapValues(
    update('fields', flow(
      keyBy('name'),
      mapValues(
        (field) => field.create({ id: field.name }).toJSON()
      )
    ))
  )
)

export default (sections, dependencies) => Form
  .props(toModel(sections))
  .create(toState(sections), dependencies)