require('dotenv').config({ silent: true })

const webpack = require('webpack')
const path = require('path')

const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')

module.exports = {
  entry: {
    app: [path.resolve('src/index.js')]
  },

  output: {
    path: path.resolve('dist'),
    filename: '[name].[hash].js',
    chunkFilename: '[name].[chunkhash:8].js',
    publicPath: '/'
  },

  resolve: {
    modules: [
      'node_modules',
      path.join(__dirname, '../src')
    ],
    extensions: ['.js', '.jsx'],
    alias: {
      'react-native$': 'react-native-web',
      // 'react-native/Libraries/Renderer/shims/ReactNativePropRegistry': 'react-native-web/dist/modules/ReactNativePropRegistry/index.js'
    }
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
        test: /\.(js|jsx)$/,
        include: [
          path.join(__dirname, '../node_modules/react-router-native')
        ],
        use: 'babel-loader'
      },
      // {
      //   test: /\.(js|jsx)$/,
      //   include: [
      //     /native-base-shoutem-theme/,
      //     /react-navigation/,
      //     /react-native-easy-grid/,
      //     /react-native-drawer/,
      //     /react-native-vector-icons/,
      //     /react-native-keyboard-aware-scroll-view/,
      //     /react-native-easy-grid/,
      //     /react-native-tab-view/,
      //     /react-native-root-modal/,
      //     /react-native-root-siblings/,
      //     /react-native-iphone-x-helper/,
      //     /static-container/,
      //   ],
      //   use: {
      //     loader: 'babel-loader',
      //     options: {
      //       presets: [['@babel/env', { modules: false }], '@babel/stage-0', 'react-app'],
      //       babelrc: false
      //     }
      //   }
      // },
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
