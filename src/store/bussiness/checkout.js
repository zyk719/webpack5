/** 领标模块 */

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import { confirmOpen, confirmHealthy } from '@/store/bussiness/common'

/** constant */
import { API, STATUS, TIMEOUT, LOGIC_NAME } from '@/store/bussiness/common'

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

function hexCharCodeToStr(hexCharCodeStr) {
    let hex = hexCharCodeStr.trim()
    hex = hex.startsWith('0x') ? hex.substr(2) : hex
    // 需要被 2 整除，否则不合法
    if (hex.length % 2 !== 0) {
        return console.error('返回十六进制不合法')
    }
    let str = ''
    while (hex.length) {
        const spoon = parseInt(hex.substr(0, 2), 16)
        str += String.fromCodePoint(spoon)
        hex = hex.substr(2)
    }
    return str
}

const checkout = {
    state: {
        controller: {},
    },
    getters: {},
    mutations: {
        setCheckout(state, checkout) {
            state.controller = checkout
        },
    },
    actions: {
        async checkoutHealthy({ state }) {
            try {
                await confirmOpen(state, EQUIPMENT_NAME, LOGIC_NAME.CHECKOUT)
                await confirmHealthy(state, EQUIPMENT_NAME)
                return true
            } catch ({ message }) {
                Message.error({
                    content: `${message}`,
                    closable: true,
                })
                return false
            }
        },
        async readImage({ state, dispatch }, { box, total }) {
            /** 1. 灯光打开 */
            const openTimeId = setTimeout(dispatch, 1000, 'lightCheckout')

            /** 2. 出标 */
            const params = buildReadImageParams(box, total)
            const { ret, param } = await state.controller[API.READ_IMAGE](
                ...params
            )

            /** 1. 灯光关闭 */
            clearTimeout(openTimeId)
            setTimeout(dispatch, 1000, 'closeCheckout')

            xLog('领标结束', ret, param)
            if (ret === STATUS.READ_IMAGE_COMPLETE) {
                const resJson = hexCharCodeToStr(param[0])
                const { barcode } = JSON.parse(resJson)
                const sign = barcode.map(url => url.split('?code=')[1])
                return sign
            }

            // 尝试解析返回值
            try {
                const resJson = hexCharCodeToStr(param[0])
                const { barcode } = JSON.parse(resJson)
                const sign = barcode.map(url => url.split('?code=')[1])
                return sign
            } catch (e) {
                return []
            }
        },
    },
}

export default checkout
