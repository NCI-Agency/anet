const path = require("path")
const merge = require("webpack-merge")
const TerserPlugin = require("terser-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const webpack = require("webpack")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const paths = require("./paths")
const common = require("./webpack.common.js")

const clientConfig = merge.merge(common.clientConfig, {
  bail: true,
  devtool: "source-map",
  resolve: {
    modules: [paths.appSrc, "node_modules", "platform/web"]
  },
  output: {
    publicPath: "/assets/client/",
    filename: "static/js/[name].[chunkhash:8].js",
    chunkFilename: "static/js/[name].[chunkhash:8].chunk.js"
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true // TODO: disabled until SourceMapDevToolPlugin supports caching in webpack 5
      })
    ],
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all"
        }
      }
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production")
    }),
    new HtmlWebpackPlugin({
      title: "ANET",
      publicUrl: "/assets/client/",
      inject: true,
      template: "public/index.hbs",
      filename: path.resolve(paths.appBuild, "../../views/index.ftl"),
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
    })
  ]
})

module.exports = clientConfig
