import { Route, Switch } from 'react-router'
import { HashRouter } from 'react-router-dom'
import { NativeRouter } from 'react-router-native'

import Form from './Form'

let Router = NativeRouter
if(typeof document !== 'undefined') {
  Router = HashRouter
}

export default (
  <Router>
    <Switch>
      <Route path="/" component={Form} />
    </Switch>
  </Router>
)
