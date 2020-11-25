/** 领标模块 */

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import { confirmOpen, confirmHealthy, pResRej } from '@/store/bussiness/common'
import { hex2Str } from '@/libs/treasure'

/** constant */
import { API, STATUS, TIMEOUT, LOGIC_NAME } from '@/store/bussiness/common'
import EventNotifiers from '@/store/bussiness/EventNotifiers'

const EQUIPMENT_NAME = '领标器'
const xLog = log.bind(null, EQUIPMENT_NAME)

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
        setCheckoutControllerSubscriber(state, controller) {
            state.controller = controller
            state.subscriber = new EventNotifiers(state.controller)
        },
    },
    actions: {
        /** hardware */
        // 打开
        openCheckout({ state }) {
            const { p, res, rej } = pResRej()

            state.subscriber.removeAll()
            // success
            state.subscriber.add('OpenCompleted', res)
            state.subscriber.add('ConnectionOpened', res)
            // failed
            state.subscriber.add('DeviceError', rej)
            state.subscriber.add('FatalError', rej)
            state.subscriber.add('Timeout', rej)

            state.controller[API.CONNECT](
                LOGIC_NAME.CHECKOUT,
                TIMEOUT.CONNECT
                // (ret) => xLog(ret)
            )

            return p
        },
        // 状态
        takeCheckoutState({ state }) {
            const stateJson = state.controller.strState

            try {
                const { StDeviceStatus } = JSON.parse(stateJson)

                if (StDeviceStatus !== STATUS.HEALTHY) {
                    return Promise.reject()
                }

                return Promise.resolve()
            } catch (e) {
                return Promise.reject()
            }
        },
        // 检查
        async isCheckoutOk({ dispatch }) {
            try {
                await dispatch('openCheckout')
                await dispatch('takeCheckoutState')
                return Promise.resolve()
            } catch (e) {
                return Promise.reject()
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
