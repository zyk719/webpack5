/** 打印模块 */

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import { API, LOGIC_NAME, pResRej, TIMEOUT } from '@/store/bussiness/common'
import { STATUS } from '@/store/bussiness/common'
import {
    TYPE_PRINTER,
    STATUS_OK,
    STATUS_ERROR,
    STATUS_WARN,
} from '@/libs/constant'

const _TYPE = TYPE_PRINTER
const _NAME = '打印器'
const _NAME_ENG = 'Printer'
const _NAME_LOGIC = LOGIC_NAME.PRINTER
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _LOOK_ = `take${_NAME_ENG}State`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)

const printer = {
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
            console.log(JSON.parse(stateJson))
            try {
                const { StDeviceStatus } = JSON.parse(stateJson)
                console.log('StDeviceStatus', StDeviceStatus)

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

        // 打印
        print({ state, dispatch }, { action, content }) {
            const { p, res, rej } = pResRej()

            state.subscriber.removeAll()
            state.subscriber.add('PrintComplete', () => res('打印完成'))
            state.subscriber.add('DeviceError', () => rej('DeviceError'))
            state.subscriber.add('FatalError', () => rej('FatalError'))
            state.subscriber.add('InvalidPrintData', () =>
                rej('InvalidPrintData')
            )

            const printText =
                `R10=<西湖龙井茶${action}凭证>` +
                `,R11=<${content}>` +
                ',R12=<客服服务电话：0571-87758190/n/n>'
            const params = [
                // FormName
                'ReceiptForm',
                // FieldValues
                printText,
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
                Message.error(`凭条打印机自检异常 ${e}`)
                return rej()
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
