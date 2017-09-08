import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { onPatch } from 'mobx-state-tree'

import { asReducer } from 'utils'
import FormModel from 'core/form'

import routes from './containers'
import rootReducer from './reducers'
import rootSaga from './sagas'

import 'styles/index.scss'

const reducers = combineReducers({
  ...rootReducer,
  form: asReducer(FormModel)
})

const patchForm = (store) => onPatch(FormModel, (patch) => {
  store.dispatch({ type: 'PATCH_FORM', ...patch })
})

let composeEnhancers = compose
if (process.env.NODE_ENV !== 'production' && typeof window === 'object') {
  if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  }
}

const sagaMiddleware = createSagaMiddleware()
const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(sagaMiddleware))
)

sagaMiddleware.run(rootSaga)
patchForm(store)

const render = () => {
  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>{routes}</Provider>
    </AppContainer>,
    document.getElementById('app')
  )
}

render()

if (module.hot) {
  module.hot.accept('./containers', render)
}
