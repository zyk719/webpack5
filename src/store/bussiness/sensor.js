import { cLog, log, speakMsg } from '@/libs/treasure'
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
import { Message } from 'view-design'

const _NAME = '感应器'
const _NAME_ENG = 'Sensor'
const _NAME_LOGIC = LOGIC_NAME.SENSOR
const _STATUS = `${_NAME_ENG}Status`
const _IS_OK = `is${_NAME_ENG}Ok`
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `check${_NAME_ENG}`

const xLog = log.bind(null, _NAME)

let subscriber

const sensor = {
    state: {
        controller: {},
        statusNodes: {
            open: false,
            doorOpen: false,
        },
        status: undefined, // 'RUN' | 'SUPERVISOR'
    },
    getters: {
        [_STATUS](state) {
            let o = null
            try {
                o = JSON.parse(state.controller['strState'])
            } catch (e) {
                o = {}
            }
            return o
        },
        [_IS_OK](state, getters) {
            const stateObj = getters[_STATUS]
            return {
                status: stateObj[STATUS_KEY] === STATUS.HEALTHY,
                statusName: stateObj[STATUS_KEY],
            }
        },
        // StOperatorSwitchState
    },
    mutations: {
        [_INIT_](state, controller) {
            state.controller = controller
            subscriber = new EventNotifiers(state.controller)
        },
        setSensorStatus(state, status) {
            state.status = status
        },
    },
    actions: {
        /** hardware **/
        [_CHECK_]({ getters }) {
            const { status, statusName } = getters[_IS_OK]
            status || Message.error(`${_NAME}异常：状态${statusName}`)

            return status
        },
        [_OPEN_]({ state, dispatch, commit }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            subscriber.add('OpenCompleted', () => {})

            subscriber.add('ConnectionOpened', () => {
                const { open, doorOpen } = state.statusNodes
                const allClose = !open && !doorOpen
                const oneOpen = open && !doorOpen
                if (allClose) {
                    cLog('👌 人感应器', '#1890ff')
                    state.statusNodes.open = true
                    setTimeout(dispatch, 1000, 'startSensor')

                    state.controller[API.CONNECT](
                        LOGIC_NAME.DOOR,
                        TIMEOUT.CONNECT
                    )
                } else if (oneOpen) {
                    cLog('👌 门感应器', '#1890ff')
                    state.statusNodes.doorOpen = true
                }
            })

            subscriber.add('Timeout', () => {})

            subscriber.add('ProximityChanged', (res) => {
                // OFF 有人靠近 | ON 离开
                if (res === 'OFF') {
                    cLog('🔰 物体感应-靠近')

                    // 关闭屏保
                    document.querySelector('.screen-saver').click()
                } else if (res === 'ON') {
                    cLog('🔰 物体感应-离开')

                    // 已登录时人离开
                    const loginStatus = getToken()
                    if (loginStatus === USER_LOGIN_STATUS_NAME) {
                        speakMsg('warning', '请取走您的茶农卡')
                    }
                }
            })

            // res : 'RUN' | 'SUPERVISOR'
            subscriber.add('OperatorSwitchChanged', (status) => {
                if (status === 'RUN') {
                    cLog('🔰 门感应-打开')
                } else if (status === 'SUPERVISOR') {
                    cLog('🔰 门感应-关闭')
                }
                commit('setSensorStatus', status)
            })

            state.controller[API.CONNECT](_NAME_LOGIC, TIMEOUT.CONNECT)
        },

        /** business **/
        // 启用
        startSensor({ state, dispatch }) {
            if (!dispatch(_CHECK_)) {
                return
            }

            state.controller[API.START_SENSOR]((ret) => {
                if (ret === '0') {
                    cLog('✅ 人感应器已打开', 'green')
                }
            })
        },
    },
}

export default sensor
