/**
 * 取标门
 */

import router from '@/router'
import { Message } from 'view-design'

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

const _NAME = '取标门'
const _NAME_ENG = 'Door'
const _NAME_LOGIC = LOGIC_NAME.QR
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)

let subscriber, resolve, reject

const checkout = {
    state: {
        controller: {},
        /**
         * 状态节点
         * 标记注入
         * 标记扫码器打开
         */
        statusNodes: {
            inject: false,
            open: false,
        },
        // 等待读取二维码
        forQrReading: false,
    },
    getters: {
        qrStatus(state) {
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
        setForQrReading(state, status) {
            state.forQrReading = status
        },
    },
    actions: {
        /** hardware **/
        // 打开扫码器
        [_OPEN_]({ state, dispatch, commit }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            /**
             * OpenCompleted
             * 连接领标器：无设备不可连接，走 FatalError 回调 -43
             * 首次连接时才会触发
             */
            subscriber.add('OpenCompleted', (res) => {
                xLog('OpenCompleted    回调，返回值：', res)
            })

            /**
             * ConnectionOpened
             */
            subscriber.add('ConnectionOpened', (res) => {
                xLog('ConnectionOpened 回调，返回值：', res)
            })

            /**
             * DeviceError
             * */
            subscriber.add('DeviceError', (res) => {
                xLog('DeviceError      回调，返回值：', res)
            })

            /**
             * FatalError
             */
            subscriber.add('FatalError', (res) => {
                xLog('FatalError       回调，返回值：', res)
            })

            /**
             * Timeout
             * 读取超时会触发
             */
            subscriber.add('Timeout', (res) => {
                xLog('Timeout          回调，返回值：', res)
                commit('setForQrReading', false)
            })

            /**
             * BarcodeRead
             */
            subscriber.add('BarcodeRead', (res) => {
                xLog('BarcodeRead      回调，返回值：', res)
                commit('setForQrReading', false)
            })

            /**
             * NotSupport
             */
            subscriber.add('NotSupport', (res) => {
                xLog('NotSupport       回调，返回值：', res)
                commit('setForQrReading', false)
            })

            /**
             * ConnectionClosed
             */
            subscriber.add('ConnectionClosed', (res) => {
                xLog('ConnectionClosed 回调，返回值：', res)
            })

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
        readQr({ state }) {
            Message.info('请将二维码放到扫码口前')
            state.controller[API.READ_QR](TIMEOUT.READ_QR, (res) => {
                xLog('读码返回值', res)
            })
        },
    },
}

export default checkout
