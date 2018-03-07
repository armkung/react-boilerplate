const webpack = require('webpack')
const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const config = require('./webpack.config')

const CSS_LOADER_OPTIONS = 'localIdentName=[name]--[hash:base64:5]'

module.exports = {
  mode: 'development',

  devtool: 'cheap-eval-source-map', // use cheap-eval-source-map for slower builds but better debugging

  entry: {
    app: [
      'react-hot-loader/patch',
      'webpack-hot-middleware/client?reload=true',
      ...config.entry.app
    ]
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
