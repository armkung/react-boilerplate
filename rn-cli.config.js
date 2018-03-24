const path = require('path')

module.exports = {
  extraNodeModules: {
    'react-native': path.join(__dirname, './app/node_modules/react-native'),
    'core': path.join(__dirname, './src/core'),
    'components': path.join(__dirname, './src/components'),
    'containers': path.join(__dirname, './src/containers'),
    'reducers': path.join(__dirname, './src/reducers'),
    'sagas': path.join(__dirname, './src/sagas'),
    'selectors': path.join(__dirname, './src/selectors'),
    'styles': path.join(__dirname, './src/styles'),
    'utils': path.join(__dirname, './src/utils')
  },
  getProjectRoots() {
    return [
      path.join(__dirname, './app/node_modules'),
      path.join(__dirname, './src'),
      path.join(__dirname, './node_modules')
    ]
  }
}