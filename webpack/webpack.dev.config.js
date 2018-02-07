const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const config = require('./base.config')

const CSS_LOADER_OPTIONS = 'localIdentName=[name]--[hash:base64:5]'

module.exports = {
  mode: 'development',
  
  devtool: 'cheap-eval-source-map',

  entry: config.entry,
  
  devServer: {
    contentBase: './src/',
    hot: true,
    historyApiFallback: true,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    port: 8000,
    publicPath: '/',
    disableHostCheck: true,
    noInfo: false,
    quiet: false,
    stats: 'minimal'
  },

  resolve: config.resolve,

  output: config.output,

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HTMLWebpackPlugin({
      inject: true,
      template: 'src/index.html'
    }),
    ...config.plugins
  ],

  module: {
    rules: [
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
