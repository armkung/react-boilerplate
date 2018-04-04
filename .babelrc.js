// const preset = () => ({
//   plugins: [
//     require('./babel-plugin/patch-lodash-fp.js')
//   ]
// })

module.exports = {
  presets: [['@babel/env', { modules: false }], '@babel/stage-1', '@babel/react', './babel-plugin'],
  env: {
    test: {
      plugins: [
        'transform-es2015-modules-commonjs'
      ]
    }
  },
  plugins: [
    'react-hot-loader/babel',
    'lodash'
    // 'react-native-web'
  ]
}