const path = require('path')

const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const PreloadPlugin = require('preload-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HTMLPlugin = require('html-webpack-plugin')
const config = require('./webpack.config')

const extractText = (fallback, use) =>
  ExtractTextPlugin.extract({ fallback, use })

const CSS_LOADER_OPTIONS =
  'sourceMaps&minimize&localIdentName=[name]--[hash:base64:5]'

module.exports = {
  mode: 'production',

  devtool: 'source-map',

  entry: config.entry,

  resolve: config.resolve,

  output: config.output,

  optimization: {
    // runtimeChunk: true,
    // minimize: false,
    minimizer: [new UglifyJSPlugin({
      parallel: true,
      sourceMap: true,
      uglifyOptions: {
        ecma: 6,
        output: { comments: false }
      }
    })],
    splitChunks: {
      chunks: 'initial',
      cacheGroups: {
      //   default: {
      //     minChunks: 2,
      //     priority: -20,
      //     reuseExistingChunk: true
      //   },
        vendors: {
          chunks: 'initial',
          test: /node_modules/,
          name: 'vendor',
          enforce: true,
          reuseExistingChunk: true
        }
      }
    }
  },

  plugins: [
    new BundleAnalyzerPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new CleanPlugin([
      'dist'
    ], {
      root: path.join(__dirname, '..')
    }),
    new ExtractTextPlugin({ filename: 'app.[hash].css', allChunks: true }),
    new HTMLPlugin({
      template: path.resolve('src/index.html'),
      minify: { collapseWhitespace: true }
    }),
    new PreloadPlugin({
      rel: 'preload',
      include: 'initial'
    }),
    ...config.plugins
  ],

  module: {
    rules: [
      {
        test: /\.css$/,
        use: extractText(
          'style-loader',
          `css-loader?${CSS_LOADER_OPTIONS}!postcss-loader`
        )
      },
      {
        test: /\.(sass|scss)$/,
        use: extractText(
          'style-loader',
          `css-loader?${CSS_LOADER_OPTIONS}!postcss-loader!sass-loader`
        )
      },
      ...config.module.rules
    ]
  }
}
