/** 打印模块 */

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import { API, LOGIC_NAME, pResRej, TIMEOUT } from '@/store/bussiness/common'
import { STATUS } from '@/store/bussiness/common'

const EQUIPMENT_NAME = '打印模块'
const xLog = log.bind(null, EQUIPMENT_NAME)

const printer = {
    state: {
        controller: {},
        subscriber: {},
    },
    getters: {},

    mutations: {
        setPrinterControllerSubscriber(state, controller) {
            state.controller = controller
            state.subscriber = new EventNotifiers(state.controller)
        },
    },
    actions: {
        /** hardware */
        // 打开
        openPrinter({ state }) {
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
                LOGIC_NAME.PRINTER,
                TIMEOUT.CONNECT
                // (ret) => xLog(ret)
            )

            return p
        },
        // 状态
        takePrinterState({ state }) {
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
        async isPrinterOk({ dispatch }) {
            try {
                await dispatch('openPrinter')
                await dispatch('takePrinterState')
                return Promise.resolve()
            } catch (e) {
                return Promise.reject(e)
            }
        },
        // 打印
        print({ state, dispatch }, text) {
            const { p, res, rej } = pResRej()

            state.subscriber.removeAll()
            state.subscriber.add('PrintComplete', () => res('打印完成'))
            state.subscriber.add('DeviceError', () => rej('DeviceError'))
            state.subscriber.add('FatalError', () => rej('FatalError'))
            state.subscriber.add('InvalidPrintData', () =>
                rej('InvalidPrintData')
            )

            const params = [
                // FormName
                'ReceiptForm',
                // FieldValues
                `R10=<${text.title || ''}>,R11=<${text.time || ''}>,R12=<${
                    text.content || ''
                }>`,
                // MediaName
                'ReceiptMedia',
                // Alignment
                'USEFORMDEFN',
                // offset X
                0,
                // offset Y
                0,
                // MediaAction
                'EJECT,CUT',
            ]
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
                rej()
            }

            /** 打印 */
            try {
                const response = await dispatch('print', text)
                res(response)
            } catch (e) {
                Message.error(`凭条打印时发生异常 ${e}`)
                rej()
            }

            return p
        },
    },
}

export default printer
