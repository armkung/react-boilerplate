import { flow as call, addDisposer, onPatch } from 'mobx-state-tree'
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
import { query, mutation } from 'core/service/app'
import { field } from 'core/model/app/query'

export default (sections, dependencies) => Form
  .props(toModel(sections))
  .actions((self) => ({
    fetch: call(function* (patch) {
      const { path } = patch
      if (path.endsWith('value')) {
        const variables = { id: '2', value: { value: String(Math.random()) } }
        // const update = (cache) => {
        //   const data = cache.readFragment({ fragment: Application, id: variables.id })
        //   console.log('aa', data)
          // cache.writeQuery({
          //   query: field,
          //   variables,
          //   data: {
          //     field: {
          //       ...data.field,
          //       ...variables.value
          //     }
          //   }
          // })
        // }

        yield mutation.update(variables, { 
          fetchPolicy: 'no-cache',
          refetchQueries: [{ query: field, variables }]
        }).catch(err => err)

        const data = yield query.fields()
        console.log(data)
      }
    }),
    afterCreate() {
      addDisposer(self, onPatch(self, (patch) => {
        self.fetch(patch)
      }))
    }
  }))
  .create(toState(sections), dependencies)