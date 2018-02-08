const path = require('path')

const patchLodashFP = './babel-plugin/patch-lodash-fp.js'
const fixCoverage = './babel-plugin/fix-coverage.js'

module.exports = {
  presets: [['@babel/env', { modules: false }], '@babel/stage-0', '@babel/react'],
  env: {
    test: {
      plugins: [
        patchLodashFP,
        fixCoverage,
        'transform-es2015-modules-commonjs',
      ]
    },
    production: {
      plugins: [
        patchLodashFP,
        'lodash'
      ]
    },
    development: {
      plugins: [
        patchLodashFP
      ]
    }
  }
}