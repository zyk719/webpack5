/** 打印模块 */

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import { API, LOGIC_NAME, pResRej, TIMEOUT } from '@/store/bussiness/common'
import { STATUS } from '@/store/bussiness/common'

const _NAME = '打印器'
const _NAME_ENG = 'Printer'
const _NAME_LOGIC = LOGIC_NAME.PRINTER
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)

const buildParams = (FieldValues) => {
    /**
     * 打印参数
     * 0. FormName
     * 1. FieldValues
     * 2. MediaName
     * 3. Alignment
     * 4. offsetX
     * 5. offsetY
     * 6. MediaAction
     */
    return [
        'ReceiptForm',
        FieldValues,
        'ReceiptMedia',
        'USEFORMDEFN',
        0,
        0,
        'EJECT,CUT',
    ]
}

let subscriber, resolve, reject

const printer = {
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
    getters: {},

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
        // 打开打印器
        [_OPEN_]({ state }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            /**
             * OpenCompleted
             * 连接读卡器：无设备也可以连接，不会报异常
             * 首次连接时才会触发
             */
            let isFirst = false
            subscriber.add('OpenCompleted', (res) => {
                xLog('OpenCompleted    回调，返回值：', res)
                isFirst = true
            })

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
             * 异常监听：
             * 因为使用前有设备状态查询，这个回调使用较少
             */
            subscriber.add('DeviceError', (res) => {
                xLog('DeviceError      回调，返回值：', res)
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
            subscriber.add('InvalidPrintData', (res) => {
                xLog('InvalidPrintData 回调，返回值：', res)
            })

            /**
             * PrintComplete
             * resolve promise
             */
            subscriber.add('PrintComplete', (res) => {
                xLog('PrintComplete    回调，返回值：', res)
                resolve()
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
            if (o.StDeviceStatus !== STATUS.HEALTHY) {
                return Promise.reject(`${_NAME}状态：${o.StDeviceStatus}`)
            }

            return Promise.resolve()
        },

        // 打印
        print({ state, dispatch }, { action, content }) {
            const { p, res, rej } = pResRej()
            resolve = res
            reject = rej

            const R10 = `西湖龙井茶${action}凭证`
            const R11 = content
            const R12 = '      客服服务电话：0571-87758190'
            const FieldValues = `R10=<${R10}>,R11=<${R11}>,R12=<${R12}>`
            const params = buildParams(FieldValues)
            state.controller[API.PRINT](...params)

            return p
        },
        async doPrint({ dispatch }, text) {
            const { p, res, rej } = pResRej()

            /** 设备检查 */
            try {
                await dispatch('isPrinterOk')
            } catch (e) {
                Message.error(`凭条打印机异常 ${e}`)
                return rej()
            }

            /** 打印 */
            try {
                dispatch('lightPrinter')
                await dispatch('print', text)
                res()
            } catch (e) {
                Message.error(`凭条打印时发生异常 ${e}`)
                rej()
            } finally {
                dispatch('closePrinterLight')
            }

            return p
        },
    },
}

export default printer
