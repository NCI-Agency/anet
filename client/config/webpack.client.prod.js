const path = require("path")
const merge = require("webpack-merge")
const TerserPlugin = require("terser-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const webpack = require("webpack")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const paths = require("./paths")
const common = require("./webpack.common.js")

const clientConfig = merge.merge(common.clientConfig, {
  mode: "production",
  bail: true,
  devtool: "source-map",
  resolve: {
    modules: ["platform/web", paths.appSrc, "node_modules"]
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
        terserOptions: {
          // Prevent warnings from react-scroll "Listener must be a named function"
          keep_fnames: true,
          parse: {
            // https://github.com/facebook/create-react-app/pull/4234
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            // Disabled because of an issue with Uglify breaking seemingly valid code:
            // https://github.com/facebook/create-react-app/issues/2376
            // Pending further investigation:
            // https://github.com/mishoo/UglifyJS2/issues/2011
            comparisons: false,
            // Disabled because of an issue with Terser breaking valid code:
            // https://github.com/facebook/create-react-app/issues/5250
            // Pending further investigation:
            // https://github.com/terser-js/terser/issues/120
            inline: 2
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true
          }
        },
        parallel: true
      })
    ],
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/]((react).*)[\\/]/,
          name: "react",
          chunks: "all",
          priority: 2
        },
        blueprintjs: {
          test: /[\\/]node_modules[\\/]((@blueprintjs).*)[\\/]/,
          name: "blueprintjs",
          chunks: "all",
          priority: 2
        },
        bootstrap: {
          test: /[\\/]node_modules[\\/]((bootstrap).*)[\\/]/,
          name: "bootstrap",
          chunks: "all",
          priority: 2
        },
        milsymbol: {
          test: /[\\/]node_modules[\\/]((milsymbol).*)[\\/]/,
          name: "milsymbol",
          chunks: "all",
          priority: 2
        },
        graph: {
          test: /[\\/]node_modules[\\/]((graph).*)[\\/]/,
          name: "graph",
          chunks: "all",
          priority: 2
        },
        lodash: {
          test: /[\\/]node_modules[\\/]((lodash).*)[\\/]/,
          name: "lodash",
          chunks: "all",
          priority: 2
        },
        codemirror: {
          test: /[\\/]node_modules[\\/]((codemirror).*)[\\/]/,
          name: "codemirror",
          chunks: "all",
          priority: 2
        },
        fullcalendar: {
          test: /[\\/]node_modules[\\/]((@fullcalendar).*)[\\/]/,
          name: "fullcalendar",
          chunks: "all",
          priority: 2
        },
        leaflet: {
          test: /[\\/]node_modules[\\/]((leaflet).*)[\\/]/,
          name: "leaflet",
          chunks: "all",
          priority: 2
        },
        projectstorm: {
          test: /[\\/]node_modules[\\/]((@projectstorm).*)[\\/]/,
          name: "projectstorm",
          chunks: "all",
          priority: 2
        },
        core: {
          test: /[\\/]node_modules[\\/]((core).*)[\\/]/,
          name: "core",
          chunks: "all",
          priority: 2
        },
        draft: {
          test: /[\\/]node_modules[\\/]((draft).*)[\\/]/,
          name: "draft",
          chunks: "all",
          priority: 2
        },
        d3: {
          test: /[\\/]node_modules[\\/]((d3).*)[\\/]/,
          name: "d3",
          chunks: "all",
          priority: 2
        },
        emotion: {
          test: /[\\/]node_modules[\\/]((@emotion).*)[\\/]/,
          name: "emotion",
          chunks: "all",
          priority: 2
        },
        yup: {
          test: /[\\/]node_modules[\\/]((yup).*)[\\/]/,
          name: "yup",
          chunks: "all",
          priority: 2
        },
        moment: {
          test: /[\\/]node_modules[\\/]((moment).*)[\\/]/,
          name: "moment",
          chunks: "all",
          priority: 2
        },
        other: {
          test: /[\\/]node_modules[\\/]/,
          name: "other",
          chunks: "all",
          priority: 1
        },
        commons: {
          name: "common",
          chunks: "all",
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    },
    runtimeChunk: {
      name: entrypoint => `runtime-${entrypoint.name}`
    }
  },
  performance: {
    hints: false
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production")
    }),
    new HtmlWebpackPlugin({
      title: "ANET",
      publicUrl: "/assets/client/",
      inject: true,
      template: "public/index.hbs",
      filename: path.resolve(paths.appBuild, "../../templates/index.ftlh"),
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
