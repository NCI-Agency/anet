const merge = require('webpack-merge')
const paths = require('./paths')
const ContextReplacementPlugin = require("webpack/lib/ContextReplacementPlugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')

const commonConfig = {
    module: {
        rules: [
            {
                test: /\.hbs$/,
                loader: 'handlebars-loader'
            }, {
                test: /\.js.flow$/,
                loader: 'ignore-loader'
            }, {
                test: /\.mjs$/,
                include: /node_modules/,
                type: 'javascript/auto',
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
                use: [
                    'style-loader',
                    { loader: 'css-loader', options: { importLoaders: 1 } },
                    'postcss-loader'
                ]
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
            }, {
                test: /alloy-editor-no-react\.js$/,
                use: {
                    loader: 'imports-loader',
                    options: {
                        'React': 'react',
                        'React.PropTypes': 'prop-types',
                        'React.createClass': 'create-react-class'
                    }
                }
            }
        ]
    }
}


module.exports = { 
    
    clientConfig: merge(commonConfig, {
        target: 'web',
        entry: {
            anet: [require.resolve('./polyfills'),'./src/index.js']
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
        plugins: [
            new webpack.DefinePlugin({"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)}),
            new ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/(en)$/),
            new CopyWebpackPlugin([
                { from: 'public', ignore : ['index.html'] },
            ])
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
        target: 'node',
        node: {
            __dirname: true
        },
        entry: {
            anet: [require.resolve('./polyfills_node'),'./tests/sim/Simulator.js']
        }
      })
}