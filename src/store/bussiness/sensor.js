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

const EQUIPMENT_NAME = '感应器'
const xLog = log.bind(null, EQUIPMENT_NAME)

const sensor = {
    state: {
        controller: {},
        subscriber: {},
        timeId: 0,
    },
    getters: {},
    mutations: {
        setSensorControllerSubscriber(state, controller) {
            state.controller = controller
            state.subscriber = new EventNotifiers(state.controller)
        },
        setTimeId(state, timeId) {
            state.timeId = timeId
        },
    },
    actions: {
        /** hardware */
        // 打开
        openSensor({ state }) {
            const { p, res, rej } = pResRej()

            state.subscriber.removeAll()
            // success
            state.subscriber.add('OpenCompleted', () => xLog('OpenCompleted'))
            state.subscriber.add('ConnectionOpened', () =>
                xLog('ConnectionOpened')
            )
            // failed
            state.subscriber.add('DeviceError', () => xLog('DeviceError'))
            state.subscriber.add('FatalError', () => xLog('FatalError'))
            state.subscriber.add('Timeout', () => xLog('Timeout'))

            state.controller[API.CONNECT](
                LOGIC_NAME.SENSOR,
                TIMEOUT.CONNECT,
                /**
                 * 此处回调 较 事件监听回调 靠后
                 * 执行成功 ret 0
                 * 执行失败 ret -1
                 */
                (ret) => (ret === '0' ? res() : rej())
            )

            return p
        },
        // 状态
        takeSensorState({ state }) {
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
        async isSensorOk({ dispatch }) {
            try {
                await dispatch('openSensor')
                await dispatch('takeSensorState')
                return Promise.resolve()
            } catch (e) {
                return Promise.reject()
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
                    // 清除发短信的延时 todo 退出登录时也要清除
                    clearTimeout(state.timeId)
                } else if (res === 'ON') {
                    // 已登录时人离开
                    const loginStatus = getToken()
                    if (loginStatus === USER_LOGIN_STATUS_NAME) {
                        speakMsg('warning', '请取走您的茶农卡')
                        // 倒计时 10s 后, 调接口发短信提示
                        commit(
                            'setTimeId',
                            setTimeout(() => {
                                console.error('发短信提示，未取卡')
                            }, 1000 * 10)
                        )
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
