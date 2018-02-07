import { hot } from 'react-hot-loader'
import Loadable from 'react-loadable'
import { Route, Switch, Router } from 'react-router-dom'

const Main = Loadable({
  loader: () => import('./Main'),
  loading: () => null
})

export default hot(module)(({ history }) =>
  <Router history={history}>
    <Switch>
      <Route path="/" component={Main} />
    </Switch>
  </Router>
)
