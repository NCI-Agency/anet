const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const paths = require('./paths')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const env = {
    'process.env.NODE_ENV': JSON.stringify('development'),
    PUBLIC_URL: ''
  }

const proxy = require(paths.appPackageJson).proxy

module.exports = merge(common(env), {
    devtool: 'eval',
    output: {
        pathinfo: true,
        publicPath: '/',
    },
    devServer: {
        hot: true,
        contentBase: 'public',
        proxy: [{
            context: ["/graphql", "/api"],
            target: proxy,
            // we need to bypass the proxy 
            bypass: function(req, res, proxyOptions) {
                // TODO: this is a hack, need a better mechanism 
                if (req.url.startsWith("/favicon") || req.url.startsWith("/alloy-editor")) 
                    return false
                if (req.headers.accept.indexOf("html") !== -1) {
                    return "/"
                }
            }
        
        }]
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
