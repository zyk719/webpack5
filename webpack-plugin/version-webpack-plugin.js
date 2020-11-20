/**
 * @author YiKe
 * @desc add app version.json before emit
 */

const os = require('os')

function strBytesLength(str) {
    const length = Array.prototype.reduce.call(
        str,
        (acc, _, idx) => {
            const code = str.charCodeAt(idx)
            const length = code >= 0 && code <= 128 ? 1 : 2
            acc += length
            return acc
        },
        0
    )
    return length
}

class VersionWebpackPlugin {
    constructor(options) {
        this.options = options
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync(
            'VersionWebpackPlugin',
            (compilation, cb) => {
                compilation.assets['version.json'] = {
                    source() {
                        const version = {
                            version: compilation.fullHash,
                            builder: os.hostname(),
                            date: new Date().toString(),
                            os: `${os.type()} >>> ${os.platform()} >>> ${os.release()}`,
                        }
                        const versionStr = JSON.stringify(version, null, 4)
                        return versionStr
                    },
                    size() {
                        const length = strBytesLength(this.source())
                        return length
                    },
                }
                cb()
            }
        )
    }
}

module.exports = VersionWebpackPlugin
