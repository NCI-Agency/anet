const merge = require("webpack-merge")
const webpack = require("webpack")
const common = require("./webpack.common.js")
const paths = require("./paths")

module.exports = merge(common.simConfig, {
  devtool: "eval-source-map",
  output: {
    pathinfo: true,
    path: paths.clientBuild,
    filename: "anet.sim.dev.js"
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("development")
    })
  ]
})
