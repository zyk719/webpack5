/**
 * 取标门
 */

/** helpers */
import { log, cLog } from '@/libs/treasure'
/** constant */
import {
    API,
    LOGIC_NAME,
    STATUS,
    STATUS_KEY,
    TIMEOUT,
} from '@/store/bussiness/common'
import EventNotifiers from '@/store/bussiness/EventNotifiers'
import { Message } from 'view-design'
import guideLight from '@/store/bussiness/guideLight'
import sensor from '@/store/bussiness/sensor'

const _NAME = '取标门'
const _NAME_ENG = 'Door'
const _NAME_LOGIC = LOGIC_NAME.DOOR
const _STATUS = `${_NAME_ENG}Status`
const _IS_OK = `is${_NAME_ENG}Ok`
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `check${_NAME_ENG}`

let subscriber

export default {
    state: {
        controller: {},
        statusNodes: {
            open: false,
            openFail: false,
        },
        status: undefined, // 'OPEN' | 'CLOSED'
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
        doorFriendsOk(state, getters, { door, guideLight, sensor }) {
            return (
                door.statusNodes.open &&
                guideLight.statusNodes.doorOpen &&
                sensor.statusNodes.doorOpen
            )
        },
        doorOpened(state, getters, { door, sensor }) {
            // 门的初始值从状态中取
            const doorStatus = door.status || getters[_STATUS]['StSafeState']
            const sensorStatus =
                sensor.status ||
                getters['SensorStatus']['StOperatorSwitchState']

            return doorStatus === 'OPEN' && sensorStatus === 'RUN'
        },
        doorClosed(state, getters, { door, sensor }) {
            // 门的初始值从状态中取
            const doorStatus = door.status || getters[_STATUS]['StSafeState']
            const sensorStatus =
                sensor.status ||
                getters['SensorStatus']['StOperatorSwitchState']

            return doorStatus === 'CLOSED' && sensorStatus === 'SUPERVISOR'
        },
    },
    mutations: {
        [_INIT_](state, controller) {
            state.controller = controller
            subscriber = new EventNotifiers(state.controller)
        },
        setDoorStatus(state, status) {
            state.status = status
        },
    },
    actions: {
        /** hardware: ConnectionClosed **/

        [_CHECK_]({ getters }) {
            const { status, statusName } = getters[_IS_OK]
            status || Message.error(`${_NAME}异常：状态${statusName}`)

            return status
        },
        [_OPEN_]({ state, commit }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            subscriber.add('OpenCompleted', () => {})

            subscriber.add('ConnectionOpened', () => {
                cLog('👌 门', '#1890ff')
                state.statusNodes.open = true

                // 注意：控制器状态返回是异步的，此时不能直接取状态用
            })

            subscriber.add('Timeout', () => {})

            // res: OPEN | CLOSED
            subscriber.add('SafeStateChanged', (status) => {
                if (status === 'OPEN') {
                    cLog('🔰 门-打开')
                } else if (status === 'CLOSED') {
                    cLog('🔰 门-关闭')
                }
                commit('setDoorStatus', status)
            })

            state.controller[API.CONNECT](_NAME_LOGIC, TIMEOUT.CONNECT)
        },

        /** business **/

        // 启动门控、感应事件通道
        // 需要等 门 | 门感应器（共用感应控制器） | 门开关（共用灯控制器）打开
        doorReady({ state }) {
            // callback name: sgnDoorAllEvents
            state.controller[API.READY]((ret) => {
                if (ret === '0') {
                    cLog('✅ 门和感应的事件通道打开', 'green')
                } else {
                    Message.error('门和感应的事件通道打开失败')
                }
            })
        },
    },
}
