const merge = require('webpack-merge')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const common = require('./webpack.common.js')
const paths = require('../config/paths')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const webpack = require('webpack')
const WebpackCleanupPlugin = require('webpack-cleanup-plugin')

function packageSort(packages) {
  return function sort(left, right) {
      var leftIndex = packages.indexOf(left.names[0])
      var rightindex = packages.indexOf(right.names[0])
      if (rightindex < 0)
          return -1
      if ( leftIndex < 0 || leftIndex > rightindex)
          return 1
      return -1
  }
}

module.exports = merge(common, {
  bail: true,
  devtool: 'source-map',
  output: {
    publicPath: '/assets/client/',
    filename: 'static/js/[name].[chunkhash:8].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js'
  },
  plugins: [
    new WebpackCleanupPlugin(),
    new webpack.HashedModuleIdsPlugin(),
    new InterpolateHtmlPlugin({ PUBLIC_URL: '/assets/client/' }),
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml,
      filename: paths.appBuild + '/../../views/index.ftl',
      // making sure that the manifest and polyfills are included in index.html before anything else
      chunksSortMode: packageSort(['manifest','polyfills']),
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
    new CopyWebpackPlugin([
      { from: 'public', ignore : ['index.html','alloy-editor/**/*'] },
      { from: 'node_modules/alloyeditor/dist/alloy-editor', to: 'alloy-editor'}
  ]),
    new UglifyJSPlugin({
      parallel: true,
      cache: true,
      sourceMap: true
    }),
]})
