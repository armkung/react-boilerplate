import '@babel/polyfill'
import 'styles/index.scss'

import { render } from 'react-dom'
import App from './App'

render(<App />, document.getElementById('app'))
