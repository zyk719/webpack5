/** 退标模块 */

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import EventNotifiers from '@/store/bussiness/EventNotifiers'

/** constant */
import {
    API,
    STATUS,
    TIMEOUT,
    LOGIC_NAME,
    pResRej,
} from '@/store/bussiness/common'
import { TYPE_CHECKIN, STATUS_OK, STATUS_ERROR } from '@/libs/constant'

const _TYPE = TYPE_CHECKIN
const _NAME = '退标器'
const _NAME_ENG = 'Checkin'
const _NAME_LOGIC = LOGIC_NAME.CHECKIN
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _LOOK_ = `take${_NAME_ENG}State`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)

const returnBox = {
    state: {
        controller: {},
        subscriber: {},
        count: 0,
        returnInfo: [],
    },
    getters: {
        checkinStatus(state) {
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
            state.subscriber = new EventNotifiers(state.controller)
        },
        setCount(state, count) {
            state.count = count
        },
        resetCheckin(state) {
            state.count = 0
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

        // 准备读标
        readyCheckin({ commit, state }) {
            const { p, res, rej } = pResRej()

            state.subscriber.removeAll()

            /** failed */
            // failed
            state.subscriber.add('DeviceError', () => xLog('DeviceError'))
            state.subscriber.add('FatalError', () => xLog('FatalError'))
            state.subscriber.add('Timeout', () => xLog('Timeout'))

            state.subscriber.add('ReadImageComplete', (res) =>
                xLog('ReadImageComplete', res)
            )
            state.subscriber.add('DataMissing', (res) =>
                xLog('DataMissing', res)
            )
            state.subscriber.add('DataNotSupport', (res) =>
                xLog('DataNotSupport', res)
            )
            state.subscriber.add('MediaInserted', (res) =>
                xLog('MediaInserted', res)
            )

            // 调用完成读标时的回调，可在
            state.subscriber.add('PrintHalted', () => xLog('PrintHalted'))
            state.subscriber.add('NoMedia', (res) => {
                res = JSON.parse(res)
                const count = res.labelAccnum
                commit('setCount', count)
                xLog('NoMedia', res)
            })

            state.controller[API.READ_IMAGE](
                6,
                '{"CutNum":"5"}',
                '',
                TIMEOUT.CHECKIN,
                (ret) => (ret === 0 ? res() : rej())
            )

            return p
        },
        async doCheckin({ dispatch }) {
            /** 检查读卡器 */
            try {
                await dispatch('isCheckinOk')
            } catch (e) {
                Message.warning('退标器异常，本机暂时无法为您提供服务。')
                return Promise.reject()
            }

            /** 准备读卡 */
            try {
                await dispatch('readyCheckin')
            } catch (e) {
                Message.warning('退标器异常，本机暂时无法为您提供服务。')
                return Promise.reject()
            }

            /** 亮起指示灯 */
            dispatch('lightCheckin')
            return Promise.resolve()
        },
        // 完成读卡
        doneCheckin({ dispatch, state }) {
            // todo bug 完成接收可以继续读标
            console.log(JSON.parse(state.controller.strState))
            state.subscriber.removeAll()
            state.controller['GetState']((res) => {
                console.log('GetState', JSON.parse(res))
            })
            state.controller[API.DONE_CHECKIN]((res) => {
                console.log(API.DONE_CHECKIN, res)
            })
            dispatch('closeCheckinLight')
        },
    },
}

export default returnBox
