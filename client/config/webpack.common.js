const paths = require('./paths')
const ContextReplacementPlugin = require("webpack/lib/ContextReplacementPlugin")
const webpack = require('webpack')

module.exports = {
    entry: {
        polyfills: require.resolve('./polyfills'),
        anet: './src/index.js'
    },
    // A strange workaround for a strange compile-time bug:   Error in
    // ./~/xmlhttprequest/lib/XMLHttpRequest.js   Module not found: 'child_process'
    // in ./node_modules/xmlhttprequest/lib This fix suggested in:
    // https://github.com/webpack/webpack-dev-server/issues/66#issuecomment-61577531
    externals: [
        {
            xmlhttprequest: '{XMLHttpRequest:XMLHttpRequest}'
        }
    ],
    output: {
        path: paths.appBuild,
    },
    resolve: {
        modules: [paths.appSrc, "node_modules"]
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: 'html-loader'
            }, {
                enforce: "pre",
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "eslint-loader",
                options: {
                    cache: true
                }
            }, {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true
                    }
                }
            }, {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }, {
                test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'static/media/[name].[hash:8].[ext]'
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)}),
        new ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/(en)$/),
        new webpack.optimize.CommonsChunkPlugin({
            name: "dependencies",
            minChunks: ({ resource }) => /node_modules/.test(resource)
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'manifest'
          })
    ]
}
