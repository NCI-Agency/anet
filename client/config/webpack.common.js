const merge = require("webpack-merge")
const CircularDependencyPlugin = require("circular-dependency-plugin")
const ContextReplacementPlugin = require("webpack/lib/ContextReplacementPlugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const ESLintPlugin = require("eslint-webpack-plugin")
const webpack = require("webpack")
const paths = require("./paths")

const commonConfig = {
  module: {
    rules: [
      {
        test: /\.hbs$/,
        loader: "handlebars-loader"
      },
      {
        test: /\.js.flow$/,
        loader: "ignore-loader"
      },
      {
        test: /\.m?js$/,
        include: /node_modules/,
        resolve: {
          fullySpecified: false
        },
        type: "javascript/auto"
      },
      {
        test: /\.(m?js|jsx)$/,
        include: [paths.appSrc, paths.testSrc, paths.platforms],
        use: [
          "thread-loader",
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              // see https://github.com/facebook/create-react-app/issues/6846
              cacheCompression: false
            }
          }
        ]
      },
      {
        test: /\.m?js$/,
        // Based on https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js
        include: /node_modules/,
        use: [
          "thread-loader",
          {
            loader: "babel-loader",
            options: {
              babelrc: false,
              configFile: false,
              compact: false,
              presets: [
                [
                  require.resolve("babel-preset-react-app/dependencies"),
                  { helpers: true }
                ]
              ],
              cacheDirectory: true,
              // see https://github.com/facebook/create-react-app/issues/6846
              cacheCompression: false
            }
          }
        ]
      },

      {
        test: /\.css$/,
        use: [
          "style-loader",
          { loader: "css-loader", options: { importLoaders: 1 } },
          "postcss-loader"
        ]
      },
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
        type: "asset/resource"
      }
    ]
  }
}

module.exports = {
  clientConfig: merge.merge(commonConfig, {
    target: ["web", "es5"],
    resolve: {
      alias: { vm: "vm-browserify" }
    },
    entry: {
      anet: [require.resolve("./polyfills"), "./src/index.js"]
    },
    // A strange workaround for a strange compile-time bug:   Error in
    // ./~/xmlhttprequest/lib/XMLHttpRequest.js   Module not found: 'child_process'
    // in ./node_modules/xmlhttprequest/lib This fix suggested in:
    // https://github.com/webpack/webpack-dev-server/issues/66#issuecomment-61577531
    externals: [
      {
        xmlhttprequest: "{XMLHttpRequest:XMLHttpRequest}"
      }
    ],
    output: {
      path: paths.appBuild
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        // Work-around for https://github.com/palantir/blueprint/issues/3739
        // and https://github.com/palantir/blueprint/issues/4393
        "process.env.BLUEPRINT_NAMESPACE": JSON.stringify("bp3")
      }),
      new CircularDependencyPlugin({
        // exclude detection of files based on a RegExp
        exclude: /node_modules/,
        // add errors to webpack instead of warnings
        failOnError: true,
        // allow import cycles that include an asyncronous import,
        // e.g. via import(/* webpackMode: "weak" */ './file.js')
        allowAsyncCycles: false,
        // set the current working directory for displaying module paths
        cwd: process.cwd()
      }),
      new ContextReplacementPlugin(/moment[\\/]locale$/, /^\.\/(en)$/),
      new CopyWebpackPlugin({
        patterns: [{ from: "public", globOptions: { ignore: ["index.html"] } }]
      }),
      new ESLintPlugin()
      // new webpack.optimize.CommonsChunkPlugin({
      //     name: "dependencies",
      //     minChunks: ({ resource }) => /node_modules/.test(resource)
      // }),
      // new webpack.optimize.CommonsChunkPlugin({
      //     name: 'manifest'
      //   })
    ],
    cache: {
      type: "filesystem",
      buildDependencies: {
        config: [__filename]
      }
    }
  }),

  simConfig: merge.merge(commonConfig, {
    resolve: {
      modules: [paths.appSrc, "node_modules", "platform/node"]
    },
    target: "node",
    node: {
      __dirname: true
    },
    entry: {
      anet: [require.resolve("./polyfills_node"), "./tests/sim/Simulator.js"]
    }
  })
}
