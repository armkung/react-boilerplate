import { AppContainer } from 'react-hot-loader'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { onPatch } from 'mobx-state-tree'
import { offline } from '@redux-offline/redux-offline'
import defaultOfflineConfig from '@redux-offline/redux-offline/lib/defaults'

import { asReducer } from './utils'
import FormModel from './core/app'

import routes from './containers'
import rootReducer from './reducers'
import rootSaga from './sagas'

// import 'styles/index.scss'

import gql from 'graphql-tag'

import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { persistCache } from 'apollo-cache-persist'

import { asyncSessionStorage } from 'redux-persist/storages'

const storage = asyncSessionStorage

const offlineConfig = {
  ...defaultOfflineConfig,
  persistOptions: {
    // storage,
    whitelist: ['form', 'offline']
  },
  effect: (effect, action) => {
    console.log(action.path, effect)
    // return Promise.reject({ status: 500 })
    return Promise.resolve()
  }
}

const reducers = combineReducers({
  ...rootReducer,
  form: asReducer(FormModel)
})

const patchForm = (store) => {
  // const storage = window.sessionStorage
  const cache = new InMemoryCache()

  // persistCache({
  //   cache,
  //   storage
  // })

  const client = new ApolloClient({
    link: new HttpLink({ uri: 'https://9jp8597k3r.lp.gql.zone/graphql' }),
    cache
  })

  onPatch(FormModel, (patch) => {
    store.dispatch({
      ...patch,
      type: 'PATCH_FORM',
      meta:{
        offline: {
          effect: { url: '/api/endpoint', method: 'POST'}
        }
      }
    })

    client
      .mutate({
        variables: {
          id: parseInt(Math.random()*10)
        },
        mutation: gql`
          mutation Create($id: String) {
            createWidget(id: $id) {
              widget(id: $id) {
                id
                name
              }
              hello
            }
          }
        `
      })
      .then(data => console.log(data.data.createWidget.widget))
      .catch(error => console.error(error))

  })
}

let composeEnhancers = compose
if (process.env.NODE_ENV !== 'production' && typeof window === 'object') {
  if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  }
}

const sagaMiddleware = createSagaMiddleware()
const store = createStore(
  reducers,
  composeEnhancers(
    applyMiddleware(sagaMiddleware),
    offline(offlineConfig)
  )
)

sagaMiddleware.run(rootSaga)
patchForm(store)

// const render = () => {
//   ReactDOM.render(
//     <AppContainer>
//       <Provider store={store}>{routes}</Provider>
//     </AppContainer>,
//     document.getElementById('app')
//   )
// }

// render()

// if (module.hot) {
//   module.hot.accept('./containers', render)
// }


export default () => (
  <Provider store={store}>{routes}</Provider>
)