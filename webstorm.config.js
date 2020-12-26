'use strict'
const path = require('path')

module.exports = {
    context: path.resolve(__dirname, './'),
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            crypto: 'crypto-browserify',
            stream: 'stream-browserify',
        },
        extensions: ['.js', '.vue'],
    },
}