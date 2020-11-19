const path = require('path')
const webpack = require('webpack')

/** webpack plugins */
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpackBundleAnalyzer = require('webpack-bundle-analyzer')

/** 环境变量 */
const env = require('./env.js')

/** 开发和生产环境的不同配置 */
const rules = ((env) => {
    // css loader
    const cssLoaderMapper = {
        development: 'style-loader',
        production: MiniCssExtractPlugin.loader,
    }
    const css = [
        {
            test: /\.css$/,
            use: [cssLoaderMapper[env], 'css-loader'],
        },
        {
            test: /\.less$/,
            use: [
                cssLoaderMapper[env],
                'css-loader',
                'less-loader',
                {
                    loader: 'style-resources-loader',
                    options: {
                        patterns: path.resolve(
                            __dirname,
                            './src/assets/style/variablesMixins.less'
                        ),
                        injector: 'append',
                    },
                },
            ],
        },
    ]
    const dynamicRules = [...css]

    // js loader
    if (env === 'production') {
        const js = {
            test: /\.js$/,
            // todo 兼容性配置
            loader: 'babel-loader',
            exclude: (file) =>
                /node_modules/.test(file) && !/\.vue\.js/.test(file),
        }
        dynamicRules.push(js)
    }

    return dynamicRules
})(process.env.NODE_ENV)
const plugins = ((env) => {
    const plugins = [
        new webpackBundleAnalyzer.BundleAnalyzerPlugin(),
        new MiniCssExtractPlugin({
            filename: './css/[name].[contenthash].css',
        }),
    ]
    if (env === 'production') {
        return plugins
    }
    return []
})(process.env.NODE_ENV)

/** 代理前缀和转发地址 */
const proxyBase = env.VUE_APP_PROXY_BASE
const target = env.VUE_APP_BASEURL
const proxyBaseNews = env.VUE_APP_PROXY_BASE_NEWS
const targetNews = env.VUE_APP_BASEURL_NEWS

// webpack 配置项
const dynamicConfig = {
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
        contentBase: path.resolve(__dirname, './dist'),
        writeToDisk: true,
        overlay: true,
        port: 7777,
        proxy: {
            // 基础接口转发
            [proxyBase]: {
                target,
                ws: false,
                changeOrigin: true,
                pathRewrite: {
                    [proxyBase]: '',
                },
            },
            // 新闻接口转发
            [proxyBaseNews]: {
                target: targetNews,
                ws: false,
                changeOrigin: true,
                pathRewrite: {
                    [proxyBaseNews]: '',
                },
            },
        },
    },
    module: {
        rules: [
            // Vue
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            // image
            {
                test: /\.(png|jpg|jpeg|svg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            esModule: false,
                            limit: 8192,
                            name: './images/[name].[contentHash:8].[ext]',
                        },
                    },
                ],
            },
            // font
            {
                test: /\.(woff2|woff|ttf)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            esModule: false,
                            name: './fonts/[name].[contentHash].[ext]',
                        },
                    },
                ],
            },
            ...rules,
        ],
    },
    plugins: [
        new VueLoaderPlugin(),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './public/index.html'),
        }),
        new webpack.DefinePlugin({
            'process.env': env,
        }),
        ...plugins,
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        extensions: ['.js', '.vue'],
    },
}

module.exports = dynamicConfig
