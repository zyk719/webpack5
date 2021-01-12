/** 退标模块 */

/** helpers */
import { cLog, log } from '@/libs/treasure'
import { Message } from 'view-design'
import EventNotifiers from '@/store/bussiness/EventNotifiers'

/** constant */
import {
    API,
    STATUS,
    TIMEOUT,
    LOGIC_NAME,
    pResRej,
    STATUS_KEY,
} from '@/store/bussiness/common'
import { TYPE_CHECKIN, STATUS_OK, STATUS_ERROR } from '@/libs/constant'

const _TYPE = TYPE_CHECKIN
const _NAME = '退标器'
const _NAME_ENG = 'Checkin'
const _NAME_LOGIC = LOGIC_NAME.CHECKIN
const _STATUS = `${_NAME_ENG}Status`
const _IS_OK = `is${_NAME_ENG}Ok`
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `check${_NAME_ENG}`

const xLog = log.bind(null, _NAME)

let subscriber

const returnBox = {
    state: {
        controller: {},
        statusNodes: {
            open: false,
            openFail: false,
        },
        subscriber: {},
        count: 0,
        barcode: [],
        returnInfo: [],
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
        setCount(state, count) {
            state.count = count
        },
        setBarcode(state, barcode) {
            state.barcode.push(...barcode)
        },
        clearBarcode(state) {
            state.barcode = []
        },
        resetCheckin(state) {
            state.count = 0
            state.barcode = []
        },
    },
    actions: {
        /** hardware */
        [_CHECK_]({ getters }) {
            const { status, statusName } = getters[_IS_OK]
            status || Message.error(`${_NAME}异常：状态${statusName}`)

            return status
        },
        [_OPEN_]({ state, commit }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            let isFirst = false
            subscriber.add('OpenCompleted', () => {
                cLog('👌 退标器 1st', '#1890ff')
                isFirst = true
            })

            let count = 0
            subscriber.add('ConnectionOpened', () => {
                const markOpen = () => {
                    state.statusNodes.open = true
                    cLog('👌 退标器', '#1890ff')
                }

                if (!isFirst) {
                    markOpen()
                    return
                }

                ++count === 8 && markOpen()
            })

            subscriber.add('DeviceError', () => xLog('DeviceError'))
            subscriber.add('FatalError', () => xLog('FatalError'))
            subscriber.add('Timeout', () => xLog('Timeout'))

            subscriber.add('ReadImageComplete', (res) =>
                xLog('ReadImageComplete', res)
            )
            subscriber.add('DataMissing', (res) => xLog('DataMissing', res))
            subscriber.add('DataNotSupport', (res) =>
                xLog('DataNotSupport', res)
            )
            subscriber.add('MediaInserted', (res) => xLog('MediaInserted', res))

            // 调用完成读标时的回调
            subscriber.add('PrintHalted', () => xLog('PrintHalted'))
            subscriber.add('NoMedia', (res) => {
                res = JSON.parse(res)
                const count = res.labelAccnum
                const barcode = res.barcode
                commit('setCount', count)
                commit('setBarcode', barcode)
                xLog('NoMedia', res)
            })

            state.controller[API.CONNECT](
                _NAME_LOGIC,
                TIMEOUT.CONNECT,
                (ret) => {
                    /* ret '0' */
                }
            )
        },

        // 准备读标
        readyCheckin({ state }) {
            return new Promise((resolve, reject) => {
                state.controller[API.READ_IMAGE](
                    6,
                    '{"CutNum":"5"}',
                    '',
                    TIMEOUT.CHECKIN,
                    (ret) => (ret === 0 ? resolve() : reject())
                )
            })
        },
        async doCheckin({ dispatch }) {
            /** 检查退标器 */
            if (!(await dispatch('checkCheckin'))) {
                return Promise.reject()
            }

            /** 准备收标 */
            try {
                await dispatch('readyCheckin')
            } catch (e) {
                Message.error('退标器异常，本机暂时无法为您提供服务。')
                cLog('⚠️ 退标器打开失败', 'red')
                return Promise.reject()
            }

            /** 亮起指示灯 */
            dispatch('lightCheckin')
            return Promise.resolve()
        },
        // 完成读卡
        doneCheckin({ dispatch, state }) {
            state.controller[API.DONE_CHECKIN]((res) => {
                /* res = '0' */
            })
            dispatch('closeCheckinLight')
        },
    },
}

export default returnBox
