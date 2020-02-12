const merge = require("webpack-merge")
const ContextReplacementPlugin = require("webpack/lib/ContextReplacementPlugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")
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
        // work-around from https://github.com/graphql/graphiql/issues/617#issuecomment-539034320 ;
        // TODO: may at some point be removed again
        test: /\.(ts|ts\.map|js\.map)$/,
        include: /node_modules\/graphql-language-service-interface/,
        loader: "ignore-loader"
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto"
      },
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
        options: {
          cache: true
        }
      },
      {
        test: /\.(js|jsx)$/,
        include: paths.appSrc,
        use: {
          loader: "babel-loader",
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.js$/,
        // Based on https://github.com/facebook/create-react-app/pull/3776
        include: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            babelrc: false,
            presets: [require.resolve("babel-preset-react-app/dependencies")],
            cacheDirectory: true
          }
        }
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
        use: [
          {
            loader: "file-loader",
            options: {
              name: "static/media/[name].[hash:8].[ext]"
            }
          }
        ]
      }
    ]
  }
}

module.exports = {
  clientConfig: merge(commonConfig, {
    target: "web",
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
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
      }),
      new ContextReplacementPlugin(/moment[\\/]locale$/, /^\.\/(en)$/),
      new CopyWebpackPlugin([{ from: "public", ignore: ["index.html"] }])
      // new webpack.optimize.CommonsChunkPlugin({
      //     name: "dependencies",
      //     minChunks: ({ resource }) => /node_modules/.test(resource)
      // }),
      // new webpack.optimize.CommonsChunkPlugin({
      //     name: 'manifest'
      //   })
    ]
  }),

  simConfig: merge(commonConfig, {
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
