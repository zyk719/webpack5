module.exports = {
    presets: ['@babel/preset-env'],
    plugins: [
        [
            'import',
            {
                libraryName: 'view-design',
                libraryDirectory: 'src/components',
            },
        ],
        [
            '@babel/plugin-transform-runtime',
            {
                regenerator: true,
            },
        ],
    ],
}
