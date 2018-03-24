global.React = require('react')

import '@babel/polyfill'
import { AppRegistry } from 'react-native'

import App from './App'

AppRegistry.registerComponent('app', () => App)

if(typeof document !== 'undefined') {
  AppRegistry.runApplication('app', { rootTag: document.getElementById('app') })
}
