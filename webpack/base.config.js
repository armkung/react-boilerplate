const webpack = require('webpack')
const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
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
    extensions: ['.js', '.jsx']
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css'
    }),
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
    })
  ],

  module: {
    rules: [
      {
        test: /\.js$/, // TODO: Compile @appman/nadal and push to npm registry.
        use: 'babel-loader',
        include: /@appman\/nadal/
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: 'file-loader?name=images/[name].[ext]'
      },
      {
        test: /\.(woff|woff2|eot|ttf)$/,
        use: 'file-loader?name=fonts/[name].[ext]'
      },
      {
        test: /\.html$/,
        exclude: /index/,
        use: 'html-loader'
      },
      {
        test: /\.xml$/,
        exclude: /node_modules/,
        use: 'raw-loader'
      },
        {
        test: /\.svg$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'svg-react-loader',
            query: {
              classIdPrefix: '[name]-[hash:8]__',
              propsMap: {
                fillRule: 'fill-rule'
              },
              xmlnsTest: /^xmlns.*$/
            }
          }
        ]
      }
    ]
  }
}
