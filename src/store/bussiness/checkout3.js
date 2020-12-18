/**
 * 领标模块，包含：
 * 领标器控制器
 * 控制领标，灯光
 */

import router from '@/router'

/** helpers */
import { log } from '@/libs/treasure'
import { pResRej } from '@/store/bussiness/common'
import { hex2Str } from '@/libs/treasure'

/** constant */
import {
    API,
    STATUS,
    TIMEOUT,
    LOGIC_NAME,
    STATUS_KEY,
} from '@/store/bussiness/common'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import { putCheckoutErrorCall } from '@/api/bussiness/user'

const _NAME = '领标器3'
const _NAME_ENG = 'Checkout3'
const _NAME_LOGIC = LOGIC_NAME.CHECKOUT3
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)
const _SEND_SIGN_ = 'sendSign3'
const _READ_IMAGE_ = 'readImage3'

/**
 * params
 * 1. box: number
 * 2. frontImage: object json
 *      1.  usMode: 表示几张切一次票，如举例 5 表示 5 张切一次票，取值范围(1~20)
 *      2. ucTotle: 表示此次总共出多少张票，如举例 20 表示出 20 张票，取值范围(1~200)
 *      3. ucSpeed: 可设置出票速度，设置值速度1 < 2 < 3 < 4, 速度 2 略小于 4秒 10张
 *      4. ucCutEn: 为 0 时只出票不切纸，为 1 时ucMod张切一次纸
 * 3. backImage: empty string
 * 4. timeout:  number
 */
function buildReadImageParams(box, total) {
    return [
        // box id
        box,
        // front image
        JSON.stringify({
            usMode: 5,
            ucCutEn: 1,
            ucSpeed: 3,
            ucTotle: total,
        }),
        // back image
        '',
        // timeout
        TIMEOUT.READ_IMAGE,
    ]
}

let subscriber, resolve, reject

const checkout = {
    state: {
        controller: {},
        /**
         * 状态节点
         * 标记注入
         * 标记读卡器打开
         */
        statusNodes: {
            inject: false,
            open: false,
        },
    },
    getters: {
        checkoutStatus3(state) {
            let o = null
            try {
                o = JSON.parse(state.controller.strState)
            } catch (e) {
                o = {}
            }
            return o
        },
    },
    mutations: {
        [_INIT_](state, controller) {
            state.controller = controller
            subscriber = new EventNotifiers(state.controller)

            // 状态登记
            state.statusNodes.inject = true
        },
    },
    actions: {
        /** hardware **/
        // 打开领标器
        [_OPEN_]({ state, dispatch }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            /**
             * OpenCompleted
             * 连接领标器：无设备不可连接，走 FatalError 回调 -43
             * 首次连接时才会触发
             */
            let isFirst = false
            subscriber.add('OpenCompleted', (res) => {
                xLog('OpenCompleted    回调，返回值：', res)
                isFirst = true
            })

            /**
             * ConnectionOpened
             * 首次连接和再次连接均会被调用
             * 首次连接时会调用 8 次，具体看图片：checkout_websocket_open.png
             */
            let count = 0
            subscriber.add('ConnectionOpened', (res) => {
                xLog('ConnectionOpened 回调，返回值：', res)
                isFirst || (state.statusNodes.open = true)

                /** 重连后页面跳转 todo 调用 8 次行为是否稳定 */
                count++
                if (count === 8) {
                    state.statusNodes.open = true
                    setTimeout(() => {
                        xLog(JSON.parse(state.controller.strState))
                    }, 99)
                }
            })

            /**
             * DeviceError
             * 在出标时会报异常，可通过 state.customer.checkoutLoading 判断
             * 且异常后，ReadImageComplete 回调不会再被调用
             * 1. todo 手动上报异常
             * 2. 关灯
             * 3. 返回首页
             * */
            subscriber.add('DeviceError', (res) => {
                xLog(
                    'DeviceError      回调，返回值：',
                    res,
                    JSON.parse(state.controller.strState)
                )
                if (state.customer.checkoutLoading) {
                    dispatch('closeCheckoutLight')
                    const params = {
                        equ_user_code: '',
                    }
                    putCheckoutErrorCall({})
                    return router.push('/user/cross')
                }
            })

            /**
             * FatalError
             * 硬件未连接时，会报这个错 res -43
             */
            subscriber.add('FatalError', (res) => {
                xLog('FatalError       回调，返回值：', res)
            })

            subscriber.add('Timeout', (res) => {
                xLog('Timeout          回调，返回值：', res)
            })

            /**
             * ReadImageComplete
             * 出标结束时调用，返回出标数据
             */
            subscriber.add('ReadImageComplete', (res) => {
                xLog('ReadImageComplete回调，返回值：', hex2Str(res))
                resolve(res)
            })

            /*
            subscriber.add('DataMissing', (res) => {
                xLog('DataMissing      回调，返回值：', res)
            })
            subscriber.add('DataNotSupport', (res) => {
                xLog('DataNotSuppor    回调，返回值：', res)
            })
            subscriber.add('MediaInserted', (res) => {
                xLog('MediaInserted    回调，返回值：', res)
            })
            subscriber.add('PrintHalted', (res) => {
                xLog('PrintHalted      回调，返回值：', res)
            })
            subscriber.add('NoMedia', (res) => {
                xLog('NoMedia          回调，返回值：', res)
            })
            */

            state.controller[API.CONNECT](_NAME_LOGIC, TIMEOUT.CONNECT)
        },
        [_CHECK_]({ state }) {
            const stateJson = state.controller.strState
            let o = null
            try {
                o = JSON.parse(stateJson)
                xLog('状态', o)
            } catch (e) {
                return Promise.reject(`${_NAME}状态解析异常`)
            }
            if (o[STATUS_KEY] !== STATUS.HEALTHY) {
                return Promise.reject(`${_NAME}状态：${o[STATUS_KEY]}`)
            }

            return Promise.resolve()
        },

        // 出标
        [_SEND_SIGN_]({ state }, params) {
            const { p, res, rej } = pResRej()

            resolve = res
            reject = rej

            state.controller[API.READ_IMAGE](...params)

            return p
        },
        async [_READ_IMAGE_]({ state, dispatch }, { box, total }) {
            /** 1. 灯光打开 */
            dispatch('lightCheckout')

            /** 2. 出标 */
            const params = buildReadImageParams(box, total)
            const res = await dispatch(_SEND_SIGN_, params)

            /** 1. 灯光关闭 */
            dispatch('closeCheckoutLight')

            const resJson = hex2Str(res)
            let { barcode } = JSON.parse(resJson)
            barcode = [...new Set(barcode)]
            return barcode
        },
    },
}

export default checkout
