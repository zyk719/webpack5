/** 打印模块 */

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import { API, LOGIC_NAME, TIMEOUT } from '@/store/bussiness/common'
import { STATUS } from '@/store/bussiness/common'

const EQUIPMENT_NAME = '打印模块'
const xLog = log.bind(null, EQUIPMENT_NAME)

const printer = {
    state: {
        controller: {},
        subscriber: {},
    },
    getters: {},
    actions: {
        openPrinter({ state }) {
            let resolve, reject
            const openRes = new Promise((res, rej) => {
                resolve = res
                reject = rej
            })

            // 连接成功
            const openSuccess = (res) => {
                resolve(res)
            }

            // 连接失败
            const openFailed = (res) => {
                reject(res)
            }

            // 注册事件
            state.subscriber.removeAll()
            state.subscriber.add('OpenCompleted', openSuccess)
            state.subscriber.add('ConnectionOpened', openSuccess)
            state.subscriber.add('FatalError', openFailed)
            state.subscriber.add('Timeout', openFailed)
            state.subscriber.add('DeviceError', openFailed)

            // 执行
            state.controller[API.CONNECT](
                LOGIC_NAME.PRINTER,
                TIMEOUT.CONNECT,
                (ret) => xLog(ret)
            )

            return openRes
        },
        getPrinterState({ state }) {
            const stateJson = state.controller.strState

            try {
                const { StDeviceStatus } = JSON.parse(stateJson)
                return StDeviceStatus === STATUS.HEALTHY
            } catch (e) {
                return false
            }
        },
        print({ state }, text) {
            let resolve, reject
            const printRes = new Promise((res, rej) => {
                resolve = res
                reject = rej
            })

            const printSuccess = (res) => {
                xLog(res)
                Message.success('凭条打印完成，请取走您的凭条')
            }

            const printFailed = (res) => {}

            state.subscriber.removeAll()
            state.subscriber.add('PrintComplete', printSuccess)
            state.subscriber.add('DeviceError', printFailed)
            state.subscriber.add('FatalError', printFailed)
            state.subscriber.add('InvalidPrintData', printFailed)

            const params = [
                // FormName
                'ReceiptForm',
                // FieldValues
                'R10=<凭证>,R11=<内容一>,R12=<内容二>',
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

            return printRes
        },
        doPrinter() {},
    },
    mutations: {
        setPrinterController(state, printer) {
            state.controller = printer

            // 消息中心初始化 todo 同步调用会导致软件异常
            setTimeout(() => {
                state.subscriber = new EventNotifiers(state.controller)
            }, 2000)
        },
        setPrinterSubscriber(state, subscriber) {
            state.subscriber = subscriber
        },
    },
}

export default printer
