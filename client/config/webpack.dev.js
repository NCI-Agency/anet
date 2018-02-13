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
        historyApiFallback: true,
        contentBase: 'public',
        proxy: [{
            context: ["/graphql", "/api"],
            target: proxy,
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
