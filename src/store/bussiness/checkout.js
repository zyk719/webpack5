/**
 * 领标模块，包含：
 * 领标器控制器
 * 控制领标，灯光
 */

import router from '@/router'

/** helpers */
import { cLog, log } from '@/libs/treasure'
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
import { Message } from 'view-design'

const _NAME = '领标器'
const _NAME_ENG = 'Checkout'
const _NAME_LOGIC = LOGIC_NAME.CHECKOUT
const _STATUS = `${_NAME_ENG}Status`
const _IS_OK = `is${_NAME_ENG}Ok`
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `check${_NAME_ENG}`
const _SEND_SIGN_ = 'sendSign'
const _READ_IMAGE_ = 'readImage'

const xLog = log.bind(null, _NAME)

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
        [_STATUS](state) {
            let o = null
            try {
                o = JSON.parse(state.controller['strState'])
            } catch (e) {
                o = {}
            }
            return o
        },
        [_IS_OK](state, getters) {
            const stateObj = getters[_STATUS]
            return {
                status: stateObj[STATUS_KEY] === STATUS.HEALTHY,
                statusName: stateObj[STATUS_KEY],
            }
        },
    },
    mutations: {
        [_INIT_](state, controller) {
            state.controller = controller
            subscriber = new EventNotifiers(state.controller)
        },
    },
    actions: {
        /** hardware **/

        [_CHECK_]({ getters }) {
            const { status, statusName } = getters[_IS_OK]
            status || Message.error(`${_NAME}异常：状态${statusName}`)

            return status
        },

        // 打开领标器
        [_OPEN_]({ state, dispatch }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            // 首次连接时才会触发
            let isFirst = false
            subscriber.add('OpenCompleted', () => {
                cLog('👌 领标器 1st', '#1890ff')
                isFirst = true
            })

            /**
             * 首次连接和再次连接均会被调用
             * 首次连接时会调用 8 次，具体看图片：checkout_websocket_open.png
             */
            let count = 0
            subscriber.add('ConnectionOpened', () => {
                const markOpen = () => {
                    state.statusNodes.open = true
                    cLog('👌 领标器', '#1890ff')
                }

                if (!isFirst) {
                    markOpen()
                    return
                }

                /** 重连后页面跳转 todo 调用 8 次行为是否稳定 */
                ++count === 8 && markOpen()
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
                    return router.push('/user/crossroad')
                }
            })

            /**
             * FatalError
             * 硬件未连接时，会报这个错 res -43
             */
            subscriber.add('FatalError', () => xLog('FatalError'))

            subscriber.add('Timeout', () => xLog('Timeout'))

            /**
             * ReadImageComplete
             * 出标结束时调用，返回出标数据
             */
            subscriber.add('ReadImageComplete', (res) => {
                cLog(`🔰 出标结束：${hex2Str(res)}`)
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

            state.controller[API.CONNECT](
                _NAME_LOGIC,
                TIMEOUT.CONNECT,
                (res) => res
            )
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
            const res = await dispatch('sendSign', params)

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
