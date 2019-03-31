const merge = require("webpack-merge")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const common = require("./webpack.common.js")
const paths = require("./paths")

module.exports = merge(common.clientConfig, {
  resolve: {
    modules: [paths.appSrc, "node_modules", "platform/web-dev"]
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
    contentBase: "public",
    port: process.env.DEV_PORT,
    proxy: [
      {
        context: ["/graphql", "/api"],
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
    }),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ]
})
