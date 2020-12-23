module.exports = {
    presets: [['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }]],
    plugins: [
        [
            'import',
            {
                libraryName: 'view-design',
                libraryDirectory: 'src/components',
            },
        ],
        ['@babel/plugin-transform-runtime'],
    ],
}
