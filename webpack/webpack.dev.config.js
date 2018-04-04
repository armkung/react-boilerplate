const webpack = require('webpack')
const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const config = require('./webpack.config')

const CSS_LOADER_OPTIONS = 'localIdentName=[name]--[hash:base64:5]'

const isExpressServer = process.argv.some(path => path.endsWith('server/server.js'))

module.exports = {
  mode: 'development',
  
  devtool: 'cheap-eval-source-map',

  entry: {
    app: [
      'react-hot-loader/patch',
      ...config.entry.app
    ].concat(isExpressServer ? ['webpack-hot-middleware/client?reload=true'] : [])
  },

  devServer: {
    contentBase: './src/',
    hot: true,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    port: 8000,
    publicPath: '/',
    noInfo: false,
    quiet: false,
    disableHostCheck: true,
    stats: {
      warnings: false,
      assets: false,
      colors: true,
      version: false,
      hash: false,
      timings: false,
      chunks: false,
      chunkModules: false
    }
  },

  resolve: config.resolve,

  output: config.output,

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HTMLWebpackPlugin({
      template: path.resolve('src/index.html'),
      minify: { collapseWhitespace: true }
    }),
    ...config.plugins
  ],

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'react-hot-loader/webpack'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          `css-loader?${CSS_LOADER_OPTIONS}`,
          'postcss-loader'
        ]
      },
       {
        test: /\.(sass|scss)$/,
        use: [
          'style-loader',
          `css-loader?${CSS_LOADER_OPTIONS}`,
          'postcss-loader',
          'sass-loader'
        ]
      },
      ...config.module.rules
    ]
  }
}
