const Enzyme = require('enzyme')
const Adapter = require('enzyme-adapter-react-16')

Enzyme.configure({ adapter: new Adapter() })

const app = document.createElement('div')
app.setAttribute('id', 'app')
document.body.append(app)

global.React = require('react')
global.fetch = require('jest-fetch-mock')