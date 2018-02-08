require('dotenv').config({ silent: true })

const webpack = require('webpack')
const path = require('path')

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
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.ProvidePlugin({
      React: 'react'
    })
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
