const path = require('path')
const webpack = require('webpack')

/** webpack plugins */
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpackBundleAnalyzer = require('webpack-bundle-analyzer')
const VersionPlugin = require('./webpack-plugin/version-webpack-plugin')
const AddScriptWebpackPlugin = require('./webpack-plugin/add-script-webpack-plugin')

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
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: process.env.NODE_ENV === 'development',
                    },
                },
                'less-loader',
                {
                    loader: 'style-resources-loader',
                    options: {
                        patterns: path.resolve(
                            __dirname,
                            './src/variablesMixins.less'
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
            // todo 摇树
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
        // new webpackBundleAnalyzer.BundleAnalyzerPlugin(),
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
const {
    VUE_APP_PROXY_BASE,
    VUE_APP_BASEURL,
    VUE_APP_PROXY_BASE_NEWS,
    VUE_APP_BASEURL_NEWS,
} = env
Object.keys(env).forEach((key) => (env[key] = JSON.stringify(env[key])))

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
    devtool:
        process.env.NODE_ENV === 'development'
            ? 'inline-source-map'
            : undefined,
    devServer: {
        contentBase: path.resolve(__dirname, './dist'),
        writeToDisk: false,
        overlay: true,
        host: '0.0.0.0',
        port: 8080,
        proxy: {
            // 基础接口转发
            [VUE_APP_PROXY_BASE]: {
                target: VUE_APP_BASEURL,
                ws: false,
                changeOrigin: true,
                pathRewrite: {
                    [VUE_APP_PROXY_BASE]: '',
                },
            },
            // 新闻接口转发
            [VUE_APP_PROXY_BASE_NEWS]: {
                target: VUE_APP_BASEURL_NEWS,
                ws: false,
                changeOrigin: true,
                pathRewrite: {
                    [VUE_APP_PROXY_BASE_NEWS]: '',
                },
            },
        },
    },
    module: {
        rules: [
            // Vue
            {
                test: /\.vue$/,
                use: [
                    {
                        loader: 'vue-loader',
                    },
                    // todo add loader to inject dd
                    // {
                    //     loader: path.resolve(
                    //         __dirname,
                    //         './webpack-loader/dd-loader.js'
                    //     ),
                    // },
                ],
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
                            name: '[name].[contenthash].[ext]',
                            outputPath: 'images',
                            publicPath: '../images',
                            // todo 去除不要的图片
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
                            name: '[name].[contenthash].[ext]',
                            outputPath: 'fonts',
                            publicPath: '../fonts',
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
        new VersionPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, './public'),
                    to: path.resolve(__dirname, './dist/externals'),
                    globOptions: {
                        ignore: ['**/public/*.html'],
                    },
                },
            ],
            options: {
                concurrency: 100,
            },
        }),
        // new AddScriptWebpackPlugin({
        //     script: `<script src=externals/ecjrjs.min.js></script>`,
        // }),
        // new AddScriptWebpackPlugin({
        //     script: `<script src=externals/jquery.min.js></script>`,
        // }),
        ...plugins,
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            crypto: 'crypto-browserify',
            stream: 'stream-browserify',
        },
        extensions: ['.js', '.vue'],
    },
}

module.exports = dynamicConfig
