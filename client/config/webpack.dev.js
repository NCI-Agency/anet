const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const paths = require('./paths');
const webpack = require('webpack');

const publicPath = '/';

const proxy = require(paths.appPackageJson).proxy;

module.exports = merge(common, {
    devtool: 'inline-source-map',
    devServer: {
        contentBase: paths.appPublic,
        publicPath: publicPath,
        hot: true,
        proxy: {
            "/api": proxy,
            "/graphql": proxy
        }
    },
    plugins: [
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ]

});