const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const webpack = require('webpack')
const path = require('path')

module.exports = merge(common[1], {
    output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'dist'),
    filename: 'anet.sim.dev.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development')
          })
    ]
})
