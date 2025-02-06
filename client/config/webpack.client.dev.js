const merge = require("webpack-merge")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const common = require("./webpack.common")
const paths = require("./paths")

module.exports = merge.merge(common.clientConfig, {
  target: "web",
  mode: "development",
  resolve: {
    modules: ["platform/web-dev", paths.appSrc, "node_modules"]
  },
  // switched from 'eval' to 'cheap-module-source-map' to address https://github.com/facebook/create-react-app/issues/920
  devtool: "cheap-module-source-map",
  output: {
    pathinfo: true,
    path: paths.clientBuild,
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
        context: [
          // For ANET data:
          "/graphql",
          "/api",
          "/assets",
          "/imagery",
          "/data",
          "/cxf",
          // For Keycloak authentication:
          "/login",
          "/oauth2"
        ],
        target: process.env.SERVER_URL
      }
    ],
    client: {
      overlay: {
        runtimeErrors: error => {
          // ignore some sporadic, annoying, unimportant errors from ResizeObserver
          return (
            error.message !== "ResizeObserver loop limit exceeded" &&
            error.message !==
              "ResizeObserver loop completed with undelivered notifications."
          )
        }
      }
    }
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
