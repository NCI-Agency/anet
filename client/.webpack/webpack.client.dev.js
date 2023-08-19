const merge = require("webpack-merge")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const paths = require("../config/paths.js")
const common = require("./webpack.common.js")

module.exports = merge.merge(common.clientConfig, {
  target: "web",
  mode: "development",
  resolve: {
    modules: ["platform/web-dev", paths.appSrc, "node_modules"]
  },
  // not using source maps due to https://github.com/facebook/create-react-app/issues/343#issuecomment-237241875
  // switched from 'eval' to 'cheap-module-source-map' to address https://github.com/facebook/create-react-app/issues/920
  devtool: "cheap-module-source-map",
  output: {
    pathinfo: true,
    publicPath: "/",
    filename: "static/js/[name].js",
    chunkFilename: "static/js/[name].chunk.js"
  },
  devServer: {
    hot: true,
    historyApiFallback: true,
    static: [paths.public],
    port: process.env.DEV_PORT,
    proxy: [
      {
        context: ["/graphql", "/api", "/assets", "/imagery", "/data"],
        target: process.env.SERVER_URL
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("development")
    }),
    new HtmlWebpackPlugin({
      title: "ANET",
      publicUrl: "/",
      inject: true,
      template: "public/index.hbs"
    })
  ]
})
