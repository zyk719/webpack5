/**
 * @author YiKe
 * @desc insert script tag to index.html before emit
 */

class AddScriptWebpackPlugin {
    constructor(options) {
        this.options = options
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync(
            'AddScriptWebpackPlugin',
            (compilation, cb) => {
                const html = compilation.assets['index.html'].source()
                const splitTag = '<div id="app"></div>'
                const script = this.options.script
                const htmlArr = html.split(splitTag)
                const modifiedHtml = htmlArr.join(`${splitTag}${script}`)
                compilation.assets['index.html'].source = () => modifiedHtml
                cb()
            }
        )
    }
}

module.exports = AddScriptWebpackPlugin
