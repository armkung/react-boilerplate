module.exports = {
  presets: [['@babel/env', { modules: false }], '@babel/stage-0', '@babel/react', './babel-plugin/index.js'],
  env: {
    test: {
      plugins: [
        'transform-es2015-modules-commonjs'
      ]
    }
  },
  plugins: [
    'lodash'
  ]
}