module.exports = {
    root: true,
    env: {
        node: true,
    },
    // "@vue/prettier"
    extends: ['plugin:vue/essential', 'eslint:recommended'],
    parserOptions: {
        parser: 'babel-eslint',
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-unused-vars': 'off',
        'vue/no-unused-components': 'off',
        'vue/no-parsing-error': [2, { 'x-invalid-end-tag': false }],
    },
}
