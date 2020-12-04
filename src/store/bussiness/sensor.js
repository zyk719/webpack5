import { log, speakMsg } from '@/libs/treasure'
import { getToken } from '@/libs/util'
import { USER_LOGIN_STATUS_NAME } from '@/store/bussiness/cardReader'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import {
    API,
    LOGIC_NAME,
    pResRej,
    STATUS,
    TIMEOUT,
} from '@/store/bussiness/common'
import store from '../index'
import { TYPE_SENSOR, STATUS_OK, STATUS_ERROR } from '@/libs/constant'

const _TYPE = TYPE_SENSOR
const _NAME = '感应器'
const _NAME_ENG = 'Sensor'
const _NAME_LOGIC = LOGIC_NAME.SENSOR
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _LOOK_ = `take${_NAME_ENG}State`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)

const sensor = {
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

        // 启用
        async startSensor({ state, commit, dispatch }) {
            await dispatch('isSensorOk')

            xLog('in startSensor')
            state.subscriber.removeAll()
            state.subscriber.add('ProximityChanged', (res) => {
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
            state.controller[API.START_SENSOR]((ret) => {
                xLog(ret)
            })
        },
        // 停用
        stopSensor({ state }) {
            state.subscriber.removeAll()
            state.controller[API.STOP_SENSOR]()
        },
    },
}

export default sensor
