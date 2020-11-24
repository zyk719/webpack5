import { API, LOGIC_NAME, TIMEOUT } from '@/store/bussiness/common'
import { log } from '@/libs/treasure'

const EQUIPMENT_NAME = '灯光组'
const xLog = log.bind(null, EQUIPMENT_NAME)

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
}

const guideLight = {
    state: {
        controller: {},
    },
    getters: {},
    mutations: {
        setGuideLightControllerSubscriber(state, controller) {
            state.controller = controller
        },
    },
    actions: {
        /** hardware */
        async setLight({ dispatch, state }, { equipment, action }) {
            state.controller[API.CONNECT](
                LOGIC_NAME.GUIDE_LIGHTS,
                TIMEOUT.CONNECT,
                (res) => {
                    if (res !== '0') {
                        return
                    }
                    action = action || LIGHT_ACTIONS.SLOW
                    state.controller[API.LIGHT](equipment, action)
                }
            )
        },
        lightIdc({ dispatch }) {
            dispatch('setLight', {
                equipment: EQUIPMENT.IDC,
            })
        },
        closeIdc({ dispatch }) {
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
        closeCheckout({ dispatch }) {
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
        closeCheckin({ dispatch }) {
            dispatch('setLight', {
                equipment: EQUIPMENT.CHECKIN,
                action: LIGHT_ACTIONS.OFF,
            })
        },
    },
}

export default guideLight
