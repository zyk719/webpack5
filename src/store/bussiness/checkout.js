/** 领标模块 */

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import { confirmOpen, confirmHealthy, pResRej } from '@/store/bussiness/common'
import { hex2Str } from '@/libs/treasure'

/** constant */
import { API, STATUS, TIMEOUT, LOGIC_NAME } from '@/store/bussiness/common'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import { TYPE_CHECKOUT, STATUS_OK, STATUS_ERROR } from '@/libs/constant'

const _TYPE = TYPE_CHECKOUT
const _NAME = '领标器'
const _NAME_ENG = 'Checkout'
const _NAME_LOGIC = LOGIC_NAME.CHECKOUT
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _LOOK_ = `take${_NAME_ENG}State`
const _CHECK_ = `is${_NAME_ENG}Ok`
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

const checkout = {
    state: {
        controller: {},
        subscriber: {},
    },
    getters: {},
    mutations: {
        [_INIT_](state, controller) {
            state.controller = controller
            state.subscriber = new EventNotifiers(state.controller)
        },
    },
    actions: {
        /** hardware */
        [_OPEN_]({ state }) {
            const { p, res, rej } = pResRej()

            state.subscriber.removeAll()
            // success
            state.subscriber.add('OpenCompleted', res)
            state.subscriber.add('ConnectionOpened', res)
            // failed
            state.subscriber.add('DeviceError', () =>
                rej(`${_NAME}打开：'DeviceError'`)
            )
            state.subscriber.add('FatalError', () =>
                rej(`${_NAME}打开：'FatalError'`)
            )
            state.subscriber.add('Timeout', () =>
                rej(`${_NAME}打开：'Timeout'`)
            )

            state.controller[API.CONNECT](_NAME_LOGIC, TIMEOUT.CONNECT)

            return p
        },
        [_LOOK_]({ state }) {
            const stateJson = state.controller.strState

            try {
                const { StDeviceStatus } = JSON.parse(stateJson)

                if (StDeviceStatus !== STATUS.HEALTHY) {
                    return Promise.reject(`${_NAME}状态：${StDeviceStatus}`)
                }

                return Promise.resolve()
            } catch (e) {
                return Promise.reject(`${_NAME}状态：解析异常`)
            }
        },
        [_LOOK_]({ state }) {
            const stateJson = state.controller.strState

            try {
                const { StDeviceStatus } = JSON.parse(stateJson)

                if (StDeviceStatus !== STATUS.HEALTHY) {
                    return Promise.reject(`${_NAME}状态：${StDeviceStatus}`)
                }

                return Promise.resolve()
            } catch (e) {
                return Promise.reject(`${_NAME}状态：解析异常`)
            }
        },
        async [_CHECK_]({ dispatch }) {
            try {
                await dispatch(_OPEN_)
                await dispatch(_LOOK_)
                dispatch('putIssue', [_TYPE, STATUS_OK])
                return Promise.resolve()
            } catch (e) {
                dispatch('putIssue', [_TYPE, STATUS_ERROR, e])
                return Promise.reject(e)
            }
        },

        // 出标
        sendSign({ state }, params) {
            const { p, res, rej } = pResRej()

            state.subscriber.removeAll()
            state.subscriber.add('DeviceError', (response) => {
                console.log('DeviceError', response)
            })
            state.subscriber.add('FatalError', (response) => {
                console.log('FatalError', response)
            })
            state.subscriber.add('Timeout', (response) => {
                console.log('Timeout', response)
            })

            state.subscriber.add('ReadImageComplete', res)

            state.subscriber.add('DataMissing', (response) => {
                console.log('DataMissing', response)
            })
            state.subscriber.add('DataNotSupport', (response) => {
                console.log('DataNotSupport', response)
            })
            state.subscriber.add('MediaInserted', (response) => {
                console.log('MediaInserted', response)
            })
            state.subscriber.add('PrintHalted', (response) => {
                console.log('PrintHalted', response)
            })
            state.subscriber.add('NoMedia', (response) => {
                console.log('NoMedia', response)
            })

            state.controller[API.READ_IMAGE](...params)

            return p
        },
        async readImage({ state, dispatch }, { box, total }) {
            /** 1. 灯光打开 */
            const openTimeId = setTimeout(dispatch, 1000, 'lightCheckout')

            /** 2. 出标 */
            const params = buildReadImageParams(box, total)
            const res = await dispatch('sendSign', params)

            /** 1. 灯光关闭 */
            clearTimeout(openTimeId)
            setTimeout(dispatch, 1000, 'closeCheckoutLight')

            const resJson = hex2Str(res)
            const { barcode } = JSON.parse(resJson)
            let sign = barcode.map((url) => url.split('?code=')[1])
            sign = [...new Set(sign)]
            return sign
        },
    },
}

export default checkout
