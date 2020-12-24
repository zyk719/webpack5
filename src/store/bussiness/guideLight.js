import {
    API,
    STATUS,
    TIMEOUT,
    STATUS_KEY,
    LOGIC_NAME,
} from '@/store/bussiness/common'
import { log, cLog, speakMsg } from '@/libs/treasure'
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
    DOOR_LEFT: '26',
    DOOR_RIGHT: '27',
}

/** module constant */
const _NAME = '指示灯'
const _NAME_ENG = 'GuideLight'
const _NAME_LOGIC = LOGIC_NAME.GUIDE_LIGHTS
const _STATUS = `${_NAME_ENG}Status`
const _IS_OK = `is${_NAME_ENG}Ok`
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `check${_NAME_ENG}`

const xLog = log.bind(null, _NAME)

let subscriber

const guideLight = {
    state: {
        controller: {},
        statusNodes: {
            open: false,
            doorOpen: false,
        },
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
    },
    mutations: {
        [_INIT_](state, controller) {
            state.controller = controller
            subscriber = new EventNotifiers(state.controller)
        },
    },
    actions: {
        /** hardware: DeviceError | FatalError **/
        [_CHECK_]({ getters }) {
            const { status, statusName } = getters[_IS_OK]
            status || Message.error(`${_NAME}异常：状态${statusName}`)

            return status
        },
        [_OPEN_]({ state }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            // 首次打开成功触发
            subscriber.add('OpenCompleted', () => {})

            // 打开成功触发
            subscriber.add('ConnectionOpened', () => {
                const { open, doorOpen } = state.statusNodes
                const allClose = !open && !doorOpen
                const oneOpen = open && !doorOpen
                if (allClose) {
                    cLog('👌 灯', '#1890ff')
                    state.statusNodes.open = true
                    state.controller[API.CONNECT](
                        LOGIC_NAME.DOOR,
                        TIMEOUT.CONNECT
                    )
                } else if (oneOpen) {
                    cLog('👌 门磁铁', '#1890ff')
                    state.statusNodes.doorOpen = true
                }
            })

            subscriber.add('Timeout', () => {})

            state.controller[API.CONNECT](
                _NAME_LOGIC,
                TIMEOUT.CONNECT,
                (ret) => {
                    if (ret !== '0') {
                    }
                }
            )
        },

        /** business **/
        setLight({ state }, { equipment, action }) {
            action = action || LIGHT_ACTIONS.SLOW
            state.controller[API.LIGHT](equipment, action)
        },
        setDoor({ state }, { equipment, action }) {
            action = action || LIGHT_ACTIONS.CONTINUOUS
            state.controller[API.DOOR_SWITCH](equipment, action)
        },
        // 操作灯
        lightIdc({ dispatch }) {
            dispatch('setLight', {
                equipment: EQUIPMENT.IDC,
            })
        },
        closeIdcLight({ dispatch }) {
            dispatch('setLight', {
                equipment: EQUIPMENT.IDC,
                action: LIGHT_ACTIONS.OFF,
            })
        },
        lightCheckout({ dispatch }) {
            dispatch('setLight', {
                equipment: EQUIPMENT.CHECKOUT,
            })
        },
        closeCheckoutLight({ dispatch }) {
            dispatch('setLight', {
                equipment: EQUIPMENT.CHECKOUT,
                action: LIGHT_ACTIONS.OFF,
            })
        },
        lightCheckin({ dispatch }) {
            dispatch('setLight', {
                equipment: EQUIPMENT.CHECKIN,
            })
        },
        closeCheckinLight({ dispatch }) {
            dispatch('setLight', {
                equipment: EQUIPMENT.CHECKIN,
                action: LIGHT_ACTIONS.OFF,
            })
        },
        lightPrinter({ dispatch }) {
            dispatch('setLight', {
                equipment: EQUIPMENT.PRINTER,
            })
        },
        closePrinterLight({ dispatch }) {
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

        // 操作门
        doCloseDoor({ dispatch }) {
            cLog('🔰 门磁铁-吸住')
            dispatch('setDoor', {
                equipment: EQUIPMENT.DOOR_LEFT,
            })
            setTimeout(dispatch, 100, 'setDoor', {
                equipment: EQUIPMENT.DOOR_RIGHT,
            })
            // dispatch('setDoor', {
            //     equipment: EQUIPMENT.DOOR_RIGHT,
            // })
        },
        doOpenDoor({ dispatch }) {
            cLog('🔰 门磁铁-松开')
            dispatch('setDoor', {
                equipment: EQUIPMENT.DOOR_LEFT,
                action: LIGHT_ACTIONS.OFF,
            })
            setTimeout(dispatch, 100, 'setDoor', {
                equipment: EQUIPMENT.DOOR_RIGHT,
                action: LIGHT_ACTIONS.OFF,
            })
            // dispatch('setDoor', {
            //     equipment: EQUIPMENT.DOOR_RIGHT,
            //     action: LIGHT_ACTIONS.OFF,
            // })
        },
    },
}

export default guideLight
