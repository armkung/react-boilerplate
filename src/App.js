import { AppContainer } from 'react-hot-loader'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { onPatch } from 'mobx-state-tree'

import { asReducer } from './utils'
import FormModel from './core/data/form'

import routes from './containers'
import rootReducer from './reducers'
import rootSaga from './sagas'

// import 'styles/index.scss'

import { createOfflineQueue, mutation } from 'core/service/app'

const effect = (variables, action) => Promise.resolve()
// const effect = (variables, action) => mutation
//   .create(variables)
  // .then(data => console.log(data.data.createWidget.widget))
  // .catch(error => console.error(error))

const reducers = combineReducers({
  ...rootReducer,
  form: asReducer(FormModel)
})

const patchForm = (store) => {
  onPatch(FormModel, (patch) => {
    if (typeof patch.value !== 'string') return
    
    store.dispatch({
      ...patch,
      type: 'PATCH_FORM',
      meta:{
        offline: {
          effect: {}
        }
      }
    })
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
    createOfflineQueue({ effect })
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