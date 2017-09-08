import { CLIEngine } from 'eslint'

export default new CLIEngine({
  ignore: false,
  useEslintrc: false,
  parser: 'babel-eslint',
  env: {
    'browser': true,
    'commonjs': true,
    'amd': true,
    'es6': true,
    'node': true,
    'mocha': true,
    'jest': true
  },
  parserOptions: {
    'ecmaVersion': 6,
    'sourceType': 'module'
  },
  plugins: [
    'react'
  ],
  rules: {
    'no-unused-vars': [
      'error',
      {
        'vars': 'all',
        'args': 'none'
      }
    ],
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error'
  }
})