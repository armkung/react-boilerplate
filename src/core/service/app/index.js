import { once } from 'lodash/fp'
import RxDB from 'rxdb'

RxDB.plugin(require('pouchdb-adapter-idb').default)

let resolveDB
const promise = new Promise((resolve) => {
  resolveDB = resolve
})

export const getDB = () => promise

export const initDB = once(async ({ model }) => {
  const db = await RxDB.create({
    name: 'db',
    adapter: 'idb',
    password: 'myLongAndStupidPassword',
    multiInstance: false,
    pouchSettings: {
      revs_limit: 1
    }
  })

  await db.collection({
    name: 'form',
    schema: {
      // title: '',
      // description: '',
      version: 0,
      type: 'object',
      disableKeyCompression: true,
      properties: {
        appId: {
          type: 'string',
          primary: true
        },
        form: {
          type: 'object',
          encrypted: true,
          properties: model
        }
      },
      required: []
    }
  })

  resolveDB(db)
  
  return db
})