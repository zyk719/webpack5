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

const EQUIPMENT_NAME = '退标器'
const xLog = log.bind(null, EQUIPMENT_NAME)

const returnBox = {
    state: {
        controller: {},
        subscriber: {},
        count: 0,
        returnInfo: [],
    },
    getters: {},
    mutations: {
        setCheckinControllerSubscriber(state, controller) {
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
        // 打开
        openCheckin({ state }) {
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
                LOGIC_NAME.CHECKIN,
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
        takeCheckinState({ state }) {
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
        async isCheckinOk({ dispatch }) {
            try {
                await dispatch('openCheckin')
                await dispatch('takeCheckinState')
                return Promise.resolve()
            } catch (e) {
                return Promise.reject()
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
        async doCheckin({ dispatch, commit, state }) {
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
