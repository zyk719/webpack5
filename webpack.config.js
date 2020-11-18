const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
    .BundleAnalyzerPlugin
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const env = require('./env.js')

module.exports = {
    mode: process.env.NODE_ENV,
    entry: {
        main: './src/main.js',
    },
    output: {
        publicPath: './',
        path: path.resolve(__dirname, './dist'),
        filename: './js/[name].[contenthash].js',
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.join(__dirname, '/dist'),
        port: 8087,
        writeToDisk: true,
        overlay: true,
    },
    module: {
        rules: [
            // Vue
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            // JavaScript
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: (file) =>
                    /node_modules/.test(file) && !/\.vue\.js/.test(file),
            },
            // CSS
            // MiniCssExtractPlugin.loader todo production
            {
                test: /\.(le|c)ss$/,
                use: ['style-loader', 'css-loader', 'less-loader'],
            },
            // SVG
            {
                test: /\.svg$/,
                use: ['babel-loader', 'vue-svg-loader'],
            },
            // image

            // font
            {
                test: /\.woff2|woff|ttf$/,
                loader: 'file-loader',
                options: {
                    name: './fonts/[name].[contentHash].[ext]',
                },
            },
        ],
    },
    plugins: [
        new VueLoaderPlugin(),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './public/index.html'),
        }),
        // new BundleAnalyzerPlugin({}),
        // new MiniCssExtractPlugin({
        //     filename: './css/[name].css',
        // }),
        new webpack.DefinePlugin({
            'process.env': env,
        }),
        // new webpack.HotModuleReplacementPlugin(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        extensions: ['.js', '.vue'],
    },
}
