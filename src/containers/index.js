import React from 'react'
import { Route } from 'react-router'
import { HashRouter } from 'react-router-dom'
import { NativeRouter } from 'react-router-native'

import Main from './Main'

let Router = NativeRouter
if(typeof document !== 'undefined') {
  Router = HashRouter
}

export default (
  <Router>
    <Route path="/" component={Main} />
  </Router>
)
