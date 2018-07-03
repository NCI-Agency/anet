const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const proxy = require('../package.json').proxy

module.exports = merge(common, {
    // not using source maps due to https://github.com/facebook/create-react-app/issues/343#issuecomment-237241875
    // switched from 'eval' to 'cheap-module-source-map' to address https://github.com/facebook/create-react-app/issues/920
    devtool: 'cheap-module-source-map',
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
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development')
          }),
        new HtmlWebpackPlugin({
            title: 'ANET',
            publicUrl: '/',
            inject: true,
            template: 'public/index.hbs'
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
    ]
})
