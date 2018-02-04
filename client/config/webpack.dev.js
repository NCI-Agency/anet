process.env.NODE_ENV = 'development';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const paths = require('./paths');
const webpack = require('webpack');

const publicPath = '/';

const proxy = require(paths.appPackageJson).proxy;

module.exports = merge(common, {
    devtool: 'eval',
    output: {
        pathinfo: true,
        filename: 'static/js/bundle.js'
    },
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
