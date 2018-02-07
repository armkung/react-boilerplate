const path = require('path')

const webpack = require('webpack')
const MiniCssExtractLoader = require('mini-css-extract-plugin').loader
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
// const PreloadPlugin = require('preload-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin')
const HTMLPlugin = require('html-webpack-plugin')
const config = require('./base.config')

const CSS_LOADER_OPTIONS = 'sourceMaps&minimize&localIdentName=[name]--[hash:base64:5]'

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
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: '../report/bundle.html',
      openAnalyzer: false
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new CleanPlugin([
      'dist'
    ], {
      root: path.join(__dirname, '..')
    }),
    new HTMLPlugin({
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      },
      cordovaPath: './cordova.js',
      platform: process.env.PLATFORM || '',
      template: 'src/index.html'
    }),
    // new PreloadPlugin({
    //   rel: 'preload',
    //   include: 'initial'
    // }),
    ...config.plugins
  ],

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractLoader,
          `css-loader?${CSS_LOADER_OPTIONS}`,
          'postcss-loader'
        ]
      },
      {
        test: /\.(sass|scss)$/,
        use: [
          MiniCssExtractLoader,
          `css-loader?${CSS_LOADER_OPTIONS}`,
          'postcss-loader',
          'sass-loader'
        ]
      },
      ...config.module.rules
    ]
  }
}
