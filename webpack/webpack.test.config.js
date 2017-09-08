const path = require('path')
const webpack = require('webpack')

const config = require('./webpack.config')

module.exports = {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|woff|woff2|css|sass|scss|less|styl)$/,
        use: 'null-loader'
      },
      {
        test: /\.(js|jsx)$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: config.resolve,
  externals: {
    cheerio: 'window',
    'react/addons': true,
    'react/lib/ExecutionEnvironment': true,
    'react/lib/ReactContext': true,
    'react-addons-test-utils': 'react-dom'
  },
  plugins: config.plugins
}
