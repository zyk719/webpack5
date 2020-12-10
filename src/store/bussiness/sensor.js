import { log, speakMsg } from '@/libs/treasure'
import { getToken } from '@/libs/util'
import { USER_LOGIN_STATUS_NAME } from '@/store/bussiness/cardReader'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import {
    API,
    STATUS,
    STATUS_KEY,
    LOGIC_NAME,
    TIMEOUT,
} from '@/store/bussiness/common'

const _NAME = '感应器'
const _NAME_ENG = 'Sensor'
const _NAME_LOGIC = LOGIC_NAME.SENSOR
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)

let subscriber

const sensor = {
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
    getters: {
        sensorStatus(state) {
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
    },
    actions: {
        /** hardware */
        // 打开感应器
        [_OPEN_]({ state, dispatch }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            /**
             * OpenCompleted
             * 连接领标器：无设备不可连接，走 FatalError 回调 -43
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
                state.statusNodes.open = true

                setTimeout(() => {
                    dispatch('startSensor')

                    if (isFirst) {
                        xLog(JSON.parse(state.controller.strState))
                    }
                }, 99)
            })

            /**
             * DeviceError
             * 在出标时会报异常，可通过 state.customer.checkoutLoading 判断
             * 且异常后，ReadImageComplete 回调不会再被调用
             * 1. todo 手动上报异常
             * 2. 关灯
             * 3. 返回首页
             * */
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

            subscriber.add('ProximityChanged', (res) => {
                xLog('ProximityChanged', res)
                // OFF 有人靠近 | ON 离开
                if (res === 'OFF') {
                    // 关闭屏保
                    document.querySelector('.screen-saver').click()
                } else if (res === 'ON') {
                    // 已登录时人离开
                    const loginStatus = getToken()
                    if (loginStatus === USER_LOGIN_STATUS_NAME) {
                        speakMsg('warning', '请取走您的茶农卡')
                    }
                }
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

        // 启用
        async startSensor({ state, dispatch }) {
            try {
                await dispatch('isSensorOk')
            } catch (e) {
                return
            }

            state.controller[API.START_SENSOR]((ret) => {
                xLog(ret)
            })
        },
    },
}

export default sensor
