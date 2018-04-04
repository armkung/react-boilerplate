import { AppContainer } from 'react-hot-loader'
import { Provider } from 'mobx-react'
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import { onPatch, applySnapshot } from 'mobx-state-tree'
import createSagaMiddleware from 'redux-saga'

import { asReducer } from './utils'

import routes from './containers'
import rootReducer from './reducers'
import rootSaga from './sagas'

import createForm from './core/domain/form'
import { initDB, getDB } from 'core/service/app'

// import 'styles/index.scss'

const form = createForm(async model => {
  const initialState = {
    insured: {
      firstName: 'aaa'
    }
  }
  
  applySnapshot(model, initialState)

  const db = await getDB()

  db.form.$.subscribe(data => {
    console.info(data)
  })

  onPatch(model, (patch) => {
    db.form.atomicUpsert({
      appId: '1',
      form: model.getSnapshot()
    })
  })
})

const reducers = combineReducers({
  ...rootReducer,
  form: asReducer(form)
})

const patchForm = async(store) => {  
  onPatch(form, async (patch, ...args) => {
    store.dispatch({
      ...patch,
      type: 'PATCH_FORM'
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
    applyMiddleware(sagaMiddleware)
  )
)

sagaMiddleware.run(rootSaga)
patchForm(store)
initDB({
  model: form.getSnapshotSchema()
})

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
  <AppContainer>
    <Provider form={form}>{routes}</Provider>
  </AppContainer>
)