// global.React = require('react')

import '@babel/polyfill'
import { AppRegistry } from 'react-native'
import { hot } from 'react-hot-loader'

import App from './App'



if(typeof document !== 'undefined') {
  const AppContainer = hot(module)(App)
  
  AppRegistry.registerComponent('app', () => AppContainer)
  AppRegistry.runApplication('app', { rootTag: document.getElementById('app') })
} else {
  AppRegistry.registerComponent('app', () => App)
}
