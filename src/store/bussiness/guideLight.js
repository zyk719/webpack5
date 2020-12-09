import {
    API,
    backHome,
    LOGIC_NAME,
    STATUS,
    TIMEOUT,
} from '@/store/bussiness/common'
import { log, speakMsg } from '@/libs/treasure'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import router from '@/router'
import { Message } from 'view-design'

// 灯光闪烁模式
const LIGHT_ACTIONS = {
    OFF: 'OFF',
    SLOW: 'SLOW',
    QUICK: 'QUICK',
    MEDIUM: 'MEDIUM',
    CONTINUOUS: 'CONTINUOUS',
}

const EQUIPMENT = {
    IDC: 'ENVDEPOSITORY',
    CHECKOUT: 'COINACCEPTOR',
    CHECKIN: 'SCANNER',
    PRINTER: 'RECEIPTPRINTER',
}

/** module constant */
const _NAME = '指示灯'
const _NAME_ENG = 'GuideLight'
const _NAME_LOGIC = LOGIC_NAME.GUIDE_LIGHTS
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)

let subscriber

const guideLight = {
    state: {
        controller: {},
        statusNodes: {
            inject: false,
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
        // 打开指示灯
        [_OPEN_]({ state, dispatch, commit }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            /**
             * OpenCompleted
             * 首次连接时才会触发
             */
            let isFirst = false
            subscriber.add('OpenCompleted', (res) => {
                xLog('OpenCompleted    回调，返回值：', res)
                isFirst = true
            })

            /**
             * ConnectionOpened
             * 首次连接和再次连接均会被调用
             */
            subscriber.add('ConnectionOpened', (res) => {
                xLog('ConnectionOpened 回调，返回值：', res)
                if (isFirst) {
                    setTimeout(() => {
                        xLog(JSON.parse(state.controller.strState))
                    }, 99)
                }
                state.statusNodes.open = true
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

            /**
             * Timeout
             * 打开会超时
             */
            subscriber.add('Timeout', (res) => {
                xLog('Timeout          回调，返回值：', res)
            })

            state.controller[API.CONNECT](_NAME_LOGIC, TIMEOUT.CONNECT)
        },
        // 指示灯状态检查
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
        async setLight({ dispatch, state }, { equipment, action }) {
            try {
                await dispatch('isGuideLightOk')
            } catch (e) {
                Message.error(e)
                return
            }

            action = action || LIGHT_ACTIONS.SLOW
            state.controller[API.LIGHT](equipment, action)
        },
        lightIdc({ dispatch }) {
            console.log('读卡器指示灯 ON')
            dispatch('setLight', {
                equipment: EQUIPMENT.IDC,
            })
        },
        closeIdcLight({ dispatch }) {
            console.log('读卡器指示灯 OFF')
            dispatch('setLight', {
                equipment: EQUIPMENT.IDC,
                action: LIGHT_ACTIONS.OFF,
            })
        },
        lightCheckout({ dispatch }) {
            console.log('领标器指示灯 ON')
            dispatch('setLight', {
                equipment: EQUIPMENT.CHECKOUT,
            })
        },
        closeCheckoutLight({ dispatch }) {
            console.log('领标器指示灯 OFF')
            dispatch('setLight', {
                equipment: EQUIPMENT.CHECKOUT,
                action: LIGHT_ACTIONS.OFF,
            })
        },
        lightCheckin({ dispatch }) {
            console.log('退标器指示灯 ON')
            dispatch('setLight', {
                equipment: EQUIPMENT.CHECKIN,
            })
        },
        closeCheckinLight({ dispatch }) {
            console.log('退标器指示灯 OFF')
            dispatch('setLight', {
                equipment: EQUIPMENT.CHECKIN,
                action: LIGHT_ACTIONS.OFF,
            })
        },
        lightPrinter({ dispatch }) {
            console.log('打印器指示灯 ON')
            dispatch('setLight', {
                equipment: EQUIPMENT.PRINTER,
            })
        },
        closePrinterLight({ dispatch }) {
            console.log('打印器指示灯 OFF')
            dispatch('setLight', {
                equipment: EQUIPMENT.PRINTER,
                action: LIGHT_ACTIONS.OFF,
            })
        },
        closeAllLights({ dispatch }) {
            dispatch('closePrinterLight')
            dispatch('closeCheckinLight')
            dispatch('closeCheckoutLight')
            dispatch('closeIdcLight')
        },
    },
}

export default guideLight
