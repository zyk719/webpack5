// const getOptions = require('loader-utils').getOptions

module.exports = function (source) {
    // const options = getOptions(this)
    console.log(source)
    // todo 解析 vue 能在 script
    return source
}
