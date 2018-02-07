// const preset = () => ({
//   plugins: [
//     require('./babel-plugin/patch-lodash-fp.js')
//   ]
// })

module.exports = {
  presets: [['@babel/env', { modules: false, useBuiltIns: 'entry', targets: { browsers: '> 1%, not ie <= 9' } }], '@babel/stage-1', '@babel/react'],
  env: {
    test: {
      plugins: [
        'transform-es2015-modules-commonjs', { "strictMode": false }
      ]
    }
  },
  plugins: [
    'react-hot-loader/babel',
    'lodash'
  ]
}