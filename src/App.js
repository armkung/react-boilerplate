import { createBrowserHistory } from 'history'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'

import Routes from './containers'
import rootReducer from './reducers'
import rootSaga from './sagas'

const history = createBrowserHistory()

let composeEnhancers = compose
if (process.env.NODE_ENV !== 'production' && typeof window === 'object') {
  if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  }
}

const sagaMiddleware = createSagaMiddleware({
  context: {
    history
  }
})
const reducers = combineReducers(rootReducer)
const store = createStore(
  reducers,
  composeEnhancers(
    applyMiddleware(sagaMiddleware)
  )
)

sagaMiddleware.run(rootSaga)

export default () => (
  <Provider store={store}>
    <Routes history={history} />
  </Provider>
)