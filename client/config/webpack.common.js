const path = require('path');
const paths = require('./paths');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const getClientEnvironment = require('./env');
const webpack = require('webpack');

const publicPath = '/';
const publicUrl = '';

// Get environment variables to inject into our app.
var env = getClientEnvironment(publicUrl);

module.exports = {
    entry: [
        require.resolve('./polyfills'),
        paths.appIndexJs
    ],
    devtool: 'inline-source-map',
    output: {
        path: paths.appBuild,
        publicPath: publicPath
    },
    resolve: {
        modules: [paths.appSrc, "node_modules"]
    },

    module: {
        rules: [
            {
                test: /\.html$/,
                use: 'html-loader'
            }, 
            {
                enforce: "pre",
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "eslint-loader",
                options: {
                    cache: true
                }
            },
            {
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
        new InterpolateHtmlPlugin({PUBLIC_URL: publicUrl}),
        new HtmlWebpackPlugin({inject: true, template: paths.appHtml}),
        new webpack.DefinePlugin(env),
    ]
};
