const merge = require('webpack-merge')
const TerserPlugin = require('terser-webpack-plugin')
const common = require('./webpack.common.js')
const paths = require('./paths')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const WebpackCleanupPlugin = require('webpack-cleanup-plugin')
const AsyncChunkNames = require('webpack-async-chunk-names-plugin')
const path = require('path')

module.exports = merge(common, {
  bail: true,
  devtool: 'source-map',
  output: {
    publicPath: '/assets/client/',
    filename: 'static/js/[name].[chunkhash:8].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true
      })
    ],
    splitChunks: {
      cacheGroups: {
        default: false,
        vendors: false,

        // vendor chunk
        vendor: {
          name: 'vendor',
          chunks: 'all',
          // import node_modules, split react and react-dom in separate chunks
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          // priority
          priority: -10,
        },

        // common chunk
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: -20,
          reuseExistingChunk: true,
          enforce: true
        }
      }
    }
  },
  plugins: [
    new AsyncChunkNames(),
    new WebpackCleanupPlugin(),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new HtmlWebpackPlugin({
      title: 'ANET',
      publicUrl: '/assets/client/',
      inject: true,
      template: 'public/index.hbs',
      filename: path.resolve(paths.appBuild,'../../views/index.ftl'),
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
        }
  }),
]})
