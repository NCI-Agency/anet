const merge = require('webpack-merge')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const common = require('./webpack.common.js')
const paths = require('../config/paths');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin');

const env = {
    'process.env.NODE_ENV': JSON.stringify('production'),
    PUBLIC_URL: '/assets/client/'
  }

module.exports = merge(common(env), {
  bail: true,
  devtool: 'source-map',
  plugins: [
    new CopyWebpackPlugin([
      { from: 'public', ignore : ['index.html','alloy-editor/**/*'] },
      { from: 'node_modules/alloyeditor/dist/alloy-editor', to: 'alloy-editor'}
  ]),
    new UglifyJSPlugin({
      parallel: true,
      cache: true,
      sourceMap: true
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml,
      filename: paths.appBuild + '/../../views/index.ftl',
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
  })]
})
