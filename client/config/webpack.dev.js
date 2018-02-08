process.env.NODE_ENV = 'development'

const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const paths = require('./paths')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')


const proxy = require(paths.appPackageJson).proxy

module.exports = merge(common, {
    devtool: 'eval',
    output: {
        pathinfo: true,
        filename: 'static/js/bundle.js',
        publicPath: '/',
    },
    devServer: {
        hot: true,
        proxy: {
            "/": {
                target: proxy,
                // we need to bypass the proxy 
                bypass: function(req, res, proxyOptions) {
                    if (req.headers.accept.indexOf("html") !== -1) {
                      return "/"
                    }
                }
            }
        }
    },
    plugins: [
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            inject: true,
            template: paths.appHtml,
        })
    ]

})
