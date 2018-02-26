const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const paths = require('./paths')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')

const proxy = require(paths.appPackageJson).proxy

module.exports = merge(common, {
    devtool: 'eval',
    output: {
        pathinfo: true,
        publicPath: '/',
        filename: 'static/js/[name].js',
        chunkFilename: 'static/js/[name].chunk.js'
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
        new InterpolateHtmlPlugin({ PUBLIC_URL: ''}),
        new HtmlWebpackPlugin({
            inject: true,
            template: paths.appHtml,
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
    ]
})
