import { getNowFormatDate, setToken } from '@/libs/util'
import { Notice } from 'view-design'
import axios from 'axios'
import md5 from 'js-md5'
import qs from 'qs'
import cfg from '@/config'
import store from '@/store'
import router from '@/router'

// 参数加密
const encryptParams = (params) => {
    const timestamp = getNowFormatDate()
    const signKey = cfg.signKey
    const data = JSON.stringify(params) || ''
    const sign = md5(signKey + data + timestamp + signKey).toUpperCase()
    return { sign, timestamp, data }
}

// 请求成功拦截器
function reqInterceptorsSuccess(url, config) {
    this.addUrl(url)

    // 需要加密
    config.sign && (config.data = encryptParams(config.data))

    // 防重复接口需要在 header 中添加repeatToken字段
    config.repeatToken && (config.headers['repeatToken'] = config.repeatToken)

    return config
}

// 请求失败拦截器
const reqInterceptorsError = (error) => Promise.reject(error)

// 响应成功拦截器
function resInterceptorsSuccess(url, { data, headers }) {
    this.removeUrl(url)

    // 非对象格式时直接返回
    const isDataNotObject =
        Object.prototype.toString.call(data) !== '[object Object]'
    if (isDataNotObject) {
        return data
    }

    // 对象格式时，但不存在 success 时（无需校验），直接返回
    const isNotValidObject = !('success' in data)
    if (isNotValidObject) {
        return data
    }

    // 需校验时，约定 success 为 Boolean
    if (!data.success) {
        if (data.errorCode === 600) {
            setToken('')
            router
                .push('/user/crossroad')
                .then(() => store.commit('resetCardReader'))
        }
        Notice.error({
            title: '请求出错',
            desc: data.msg || '服务器出现错误，请稍后重试',
        })
        return Promise.reject(data)
    }

    // 如果包头中含有 token 信息，添加到 data 中 todo ??? for what
    if (headers.repeattoken) {
        data.repeatToken = headers.repeattoken
    }

    return data
}

// 响应失败拦截器
function resInterceptorsError(url, error) {
    this.removeUrl(url)

    const errMsg = error.message
    console.log(error.message)
    const code = errMsg.substr(errMsg.indexOf('code') + 5)

    // 管理员登录失效
    if (String(code) === '508') {
        setToken('')
        return router.push('/admin/login')
    }

    const desc =
        code === '510' ? '请勿重复提交！' : '服务器出现错误，请稍后重试'
    Notice.error({
        title: '请求出错',
        desc,
    })
    return Promise.reject(error)
}

class HttpRequest {
    constructor(baseUrl) {
        this.baseUrl = baseUrl
        this.queue = {}
    }

    getInsideConfig() {
        const macaddr = store.state.equipment.mac
        const headers = { macaddr }
        return {
            headers,
            baseURL: this.baseUrl,
            withCredentials: true,
            transformRequest: [qs.stringify],
        }
    }

    addUrl(url) {
        // 添加全局的loading...
        if (!Object.keys(this.queue).length) {
            // Spin.show({
            //   render: (h) => {
            //     return h('div', [
            //       h('Icon', {
            //         'class': 'demo-spin-icon-load',
            //         props: {
            //           type: 'ios-loading',
            //           size: 18
            //         }
            //       }),
            //       h('div', '玩命加载中...')
            //     ])
            //   }
            // }) // 不建议开启，因为界面不友好
        }
        this.queue[url] = true
    }

    removeUrl(url) {
        delete this.queue[url]
        if (!Object.keys(this.queue).length) {
            // Spin.hide()
        }
    }

    interceptors(instance, url) {
        // 请求拦截
        instance.interceptors.request.use(
            reqInterceptorsSuccess.bind(this, url),
            reqInterceptorsError
        )
        // 响应拦截
        instance.interceptors.response.use(
            resInterceptorsSuccess.bind(this, url),
            resInterceptorsError.bind(this, url)
        )
    }

    request(options, noMac) {
        const instance = axios.create()
        options = Object.assign({}, this.getInsideConfig(), options)
        if (noMac) {
            delete options.headers.macaddr
        }
        this.interceptors(instance, options.url)
        return instance(options)
    }
}

export default HttpRequest
