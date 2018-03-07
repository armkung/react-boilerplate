require('dotenv').config({ silent: true })

const webpack = require('webpack')
const path = require('path')

const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')

module.exports = {
  entry: {
    app: ['@babel/polyfill', path.resolve('src/index.js')]
  },

  output: {
    path: path.resolve('dist'),
    filename: '[name].[hash].js',
    chunkFilename: '[name].[chunkhash:8].js',
    publicPath: '/'
  },

  resolve: {
    modules: ['node_modules', path.join(__dirname, '../src')],
    extensions: ['.js', '.jsx'],
    alias: {}
  },

  plugins: [
    new webpack.ProvidePlugin({
      React: 'react'
    }),
    new LodashModuleReplacementPlugin({
      shorthands: true,
      cloning: false,
      currying: true,
      caching: true,
      collections: true,
      exotics: true,
      guards: true,
      metadata: true,
      deburring: false,
      unicode: true,
      chaining: false,
      memoizing: true,
      coercions: true,
      flattening: true,
      paths: true,
      placeholders: true
    }),
  ],

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'file-loader?name=images/[name].[ext]'
      },
      {
        test: /\.(woff|woff2|eot|ttf)$/,
        loader: 'file-loader?name=fonts/[name].[ext]'
      }
    ]
  }
}
