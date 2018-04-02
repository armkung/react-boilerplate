import { mapValues } from 'lodash/fp'
import defaultOfflineConfig from '@redux-offline/redux-offline/lib/defaults'
import { offline } from '@redux-offline/redux-offline'
import { ApolloClient } from 'apollo-client'
import { ApolloLink, execute, Observable } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { persistCache } from 'apollo-cache-persist'
import { withClientState } from 'apollo-link-state'
import { asyncSessionStorage } from 'redux-persist/storages'
import { graphqlLodash } from 'graphql-lodash'

import * as queryModel from 'core/model/app/query'
import * as mutationModel from 'core/model/app/mutation'

const queueStorage = asyncSessionStorage
const cacheStorage = window.sessionStorage
const API_URL = 'https://9jp8597k3r.lp.gql.zone/graphql'

const cache = new InMemoryCache()

persistCache({
  cache,
  storage: cacheStorage
})


const stateLink = withClientState({
  cache,
  resolvers: {
    Mutation: {
      updateField: (obj, data, { cache }) => {
        cache.writeData({ id: `Field:${data.id}`, data })
        return data
      }
    },
    Query: {
      fieldValue: (obj, data, { cache }) => {
        console.log('aa', obj, data)
        // const data = {
        //   __typename: 'FieldValue',
        //   value: {
        //     ...value
        //   }
        // }
        // cache.writeData({ data })
        return null
      }
    }
  }
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    stateLink,
    new HttpLink({ uri: API_URL })
  ]),
  cache
})

export const createOfflineQueue = (config) => offline({
  ...defaultOfflineConfig,
  ...config,
  persistOptions: {
    storage: queueStorage,
    whitelist: ['offline']
  }
})

export const query = mapValues(
  (rawQuery) => (variables, options) => {
    const { query, transform } = graphqlLodash(rawQuery)
    return apolloClient.query({ query, variables, ...options }).then(({ data }) => transform(data))
  }
)(queryModel)
  
export const mutation = mapValues(
  (mutation) => (variables, options) => {
    return apolloClient.mutate({ mutation, variables, ...options }).then(({ data }) => data)
  }
)(mutationModel)