/**
 * 常用函数库
 */
import SparkMD5 from 'spark-md5'
import Axios from 'axios'
import { Message } from 'view-design'

/**
 * @type {any|(function(...[*]=))}
 */
export const log =
    process.env.NODE_ENV === 'development'
        ? console.log.bind(
              console,
              '%c |==>: ',
              'color:#fa541c;font-weight:bold;'
          )
        : () => {}

export const cLog = (text, color = 'black') =>
    console.log(`%c ${text}`, `color:${color};font-weight:bold;`)

/**
 * @type {boolean}
 */
export const isDev = process.env.NODE_ENV === 'development'

/**
 * @param fn
 * @returns {boolean}
 */
export const isFn = (fn) =>
    Object.prototype.toString.call(fn) === '[object Function]'

/**
 * @param o
 * @returns {boolean}
 */
export const isObj = (o) =>
    Object.prototype.toString.call(o) === '[object Object]'

/**
 * @param arr
 * @returns {boolean}
 */
export const isArr = (arr) =>
    Object.prototype.toString.call(arr) === '[object Array]'

/**
 * @param blob
 * @returns {boolean}
 */
export const isBlob = (blob) =>
    Object.prototype.toString.call(blob) === '[object Blob]'

/**
 * 倒计时工具 20201016
 * @param preSet
 * @returns 调用间隔函数
 * 一段时长、按间隔、执行指定函数 doInterval(step, interval, cb)() || doInterval(step, interval)(cb) || ...
 */
export const doInterval = (...preSet) => {
    const timeIds = new Map()
    const curStep = new Map()

    // 计时器设置函数
    const r = (step, interval, cb) => {
        // 没有 handler ，避免设置无意义的计时器
        if (!cb || !isFn(cb)) {
            isDev && console.error('没有处理函数，无用计时器，不会被设置')
            return
        }

        // 已设置计时器，静默失败
        if (timeIds.has(cb)) {
            return
        }

        // 包装 setInterval cb
        const wrapCb = () => {
            // 清除计时器、删除 curStep 和 timeId
            if (step === curStep.get(cb)) {
                clearInterval(timeIds.get(cb))
                curStep.delete(cb)
                timeIds.delete(cb)
                return
            }

            cb()
            curStep.set(cb, curStep.get(cb) + 1)
        }

        // 初始化 curStep 和 timeIds
        curStep.set(cb, 0)
        timeIds.set(cb, setInterval(wrapCb, interval))
    }

    // 预配置功能
    const preR = preSet.reduce((r, param) => r.bind(undefined, param), r)
    return preR
}

/**
 * 计算文件的 MD5
 * @param file
 * @returns {Promise<unknown>}
 */
export function fileMD5(file) {
    const fileReader = new FileReader()
    const p = new Promise((resolve, reject) => {
        // 读取成功
        fileReader.onload = ({ target: { result } }) => {
            if (file.size !== result.byteLength) {
                reject('浏览器报告成功，但在结束之前无法读取文件。')
                return
            }
            const md5 = SparkMD5.ArrayBuffer.hash(result)
            resolve(md5)
        }
        // 读取失败
        fileReader.onerror = () =>
            reject(
                'readAsArrayBuffer Error：可能是由于内存使用率高而导致浏览器中止。'
            )
    })
    fileReader.readAsArrayBuffer(file)
    return p
}

/**
 * 把对象数据转为 FormData
 * @param o
 * @param name
 * @returns {FormData}
 */
export function createFormData(o, name = 'blob') {
    const formData = new FormData()
    Object.keys(o).forEach((key) => {
        if (key === 'file') {
            const b = o[key]
            // append 会把 Blob 包装成 File
            // 后端会从 name 取格式，故设置带格式的 name
            if (isBlob(b)) {
                const fileType = b.type.split('/')[1]
                formData.append(key, o[key], `${name}.${fileType}`)
            } else {
                formData.append(key, o[key])
            }
        } else {
            formData.append(key, o[key])
        }
    })
    return formData
}

/**
 * uploadFile
 * @param formData
 * @returns {Promise<any>}
 */
export function uploadFile(formData) {
    const baseUrl =
        process.env.NODE_ENV === 'development'
            ? process.env['VUE_APP_PROXY_BASE']
            : process.env['VUE_APP_BASEURL']
    return Axios.request({
        method: 'post',
        withCredentials: true,
        url: `${baseUrl}/uploaddown/upload.action`,
        data: formData,
    })
}

/**
 * 返回 c 数组：返回 a 排除 b 的元素
 * @param aArr
 * @param bArr
 * @returns {*}
 */
export function aNob(aArr, bArr) {
    const cArr = bArr.reduce(
        (acc, value) => {
            const idx = acc.indexOf(value)
            idx > -1 && acc.splice(idx, 1)
            return acc
        },
        [...aArr]
    )
    return cArr
}

/**
 * hex2Str
 * @param hex
 * @returns {string|*}
 */
export const hex2Str = (hex) => {
    // 0. valid
    if (hex.length % 2 !== 0) {
        console.error('非法的 hex')
        return hex
    }

    // 1. 兼容 0x 0X 开头的 hex
    if (hex.startsWith('0x') || hex.startsWith('0X')) {
        hex = hex.substring(2)
    }

    // 2. encode to point
    const points = []
    while (hex.length) {
        const spoon = hex.substr(0, 2)
        const point = parseInt(spoon, 16)
        points.push(point)

        hex = hex.substring(2)
    }

    // 3. point to string(utf8)
    const string = String.fromCodePoint(...points)

    return string
}

/**
 * speak
 * @param text
 */
export const speakMsg = (msgType, text) => {
    Message[msgType](text)
    const speechInstance = new SpeechSynthesisUtterance(text)
    speechSynthesis.speak(speechInstance)
}

/**
 * @description
 * @author suge(chenshuhao)
 * @date 29/09/2020
 * @param {*} fmt yyyy-MM-dd HH:mm:ss
 * @param {*} date
 * @return {*} fmtDate
 */
export const dateFormat = (fmt, date) => {
    let ret
    const opt = {
        'y+': date.getFullYear().toString(), // 年
        'M+': (date.getMonth() + 1).toString(), // 月
        'd+': date.getDate().toString(), // 日
        'H+': date.getHours().toString(), // 时
        'm+': date.getMinutes().toString(), // 分
        's+': date.getSeconds().toString(), // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    }
    for (let k in opt) {
        ret = new RegExp('(' + k + ')').exec(fmt)
        if (ret) {
            fmt = fmt.replace(
                ret[1],
                ret[1].length === 1
                    ? opt[k]
                    : opt[k].padStart(ret[1].length, '0')
            )
        }
    }
    return fmt
}
