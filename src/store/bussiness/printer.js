/** 打印模块 */

/** helpers */
import { log } from '@/libs/treasure'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import { API, LOGIC_NAME, TIMEOUT } from '@/store/bussiness/common'

const EQUIPMENT_NAME = '打印模块'
const xLog = log.bind(null, EQUIPMENT_NAME)

const printer = {
    state: {
        controller: {},
        subscriber: {},
    },
    getters: {},
    actions: {
        open({ state, commit }) {
            state.subscriber.removeAll()
            state.subscriber.add('OpenCompleted', this.OnEventOpened)
            state.subscriber.add('ConnectionOpened', this.OnConnectionOpened)
            state.subscriber.add('FatalError', this.OnEventError)
            state.subscriber.add('Timeout', this.OnEventOpenTimeOut)
            state.subscriber.add('DeviceError', this.OnEventOpenDeviceError)

            state.controller[API.CONNECT](
                LOGIC_NAME.PRINTER,
                TIMEOUT.CONNECT,
                (ret) => xLog(ret)
            )
        },
    },
    mutations: {
        setPrinter(state, printer) {
            state.controller = printer
            // 初始化回调订阅
            setTimeout(() => {
                state.subscriber = new EventNotifiers(state.controller)
            }, 2000)
        },
    },
}

export default printer
