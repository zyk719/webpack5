/** 退标模块 */

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import { confirmOpen, confirmHealthy } from '@/store/bussiness/common'
import EventNotifiers from '@/store/bussiness/EventNotifiers'

/** constant */
import { API, STATUS, TIMEOUT, LOGIC_NAME } from '@/store/bussiness/common'

const EQUIPMENT_NAME = '退标器'
const xLog = log.bind(null, EQUIPMENT_NAME)

const returnBox = {
    state: {
        controller: {},
        subscriber: {},
        count: 0,
        // 退标盒打开关闭进度
        toggleStatus: false,
        returnInfo: [],
    },
    getters: {
        noReturn(state) {
            return state.returnInfo.length !== 0
        },
        returnSubmitInfo(state) {
            // todo 实际需要处理
            return state.returnInfo
        },
    },
    mutations: {
        setCheckin(state, controller) {
            state.controller = controller
            // 初始化回调订阅
            setTimeout(() => {
                state.subscriber = new EventNotifiers(state.controller)
            }, 2000)
        },
        removeAll(state) {
            state.subscriber.removeAll()
        },
        setCount(state, count) {
            state.count = count
        },
        resetCheckin(state) {
            state.count = 0
        },
    },
    actions: {
        // 使退标盒子为可退标状态（操作 | 确认）
        readyReturnBox({ commit }) {
            // call status api
        },
        // 退标盒子状态回调
        readyReturnBoxCb({ commit }, status) {},

        // 退标内容回调：获取退标的信息，主要是标号
        returnInfoCb({ commit }, info) {
            commit({
                type: 'setReturnInfo',
                info,
            })
        },
        // 打开退标器
        readImageCheckin({ dispatch, commit, state }) {
            commit('removeAll')
            // 关闭 > 打开
            state.subscriber.add('OpenCompleted', res => {
                console.log('my OpenCompleted', res)
                console.log('退标器状态', state.controller.strState)
                dispatch('readyCheckin')
            })
            // 打开 > 打开
            state.subscriber.add('ConnectionOpened', res => {
                console.log('my ConnectionOpened', res)
                console.log('退标器状态', state.controller.strState)
                dispatch('readyCheckin')
            })
            state.subscriber.add('FatalError', res => {
                console.log('my FatalError', res)
            })
            state.subscriber.add('Timeout', res => {
                console.log('my Timeout', res)
            })
            state.controller[API.CONNECT](LOGIC_NAME.CHECKIN, TIMEOUT.CONNECT)
        },
        // 准备读标
        readyCheckin({ dispatch, commit, state }) {
            dispatch('lightCheckin')
            commit('removeAll')
            state.subscriber.add('ReadImageComplete', res => {
                console.log('my ReadImageComplete', res)
                // const count = res.labelAccnum
                // commit('setCount', count)
            })
            state.subscriber.add('DeviceError', res => {
                console.log('DeviceError', res)
            })
            state.subscriber.add('FatalError', res => {
                console.log('FatalError', res)
            })
            state.subscriber.add('DataMissing', res => {
                console.log('DataMissing', res)
            })
            state.subscriber.add('DataNotSupport', res => {
                console.log('DataNotSupport', res)
            })
            state.subscriber.add('MediaInserted', res => {
                console.log('MediaInserted', res)
            })
            state.subscriber.add('Timeout', res => {
                console.log('Timeout', res)
            })
            state.subscriber.add('PrintHalted', res => {
                console.log('PrintHalted', res)
            })
            state.subscriber.add('NoMedia', res => {
                res = JSON.parse(res)
                const count = res.labelAccnum
                commit('setCount', count)
                console.log('退标器接收', state.controller.strState)
            })

            state.controller[API.READ_IMAGE](
                6,
                '{"CutNum":"5"}',
                '',
                TIMEOUT.CHECKIN
            )
        },
        // 完成读卡
        doneCheckin({ dispatch, state }) {
            state.controller[API.DONE_CHECKIN](res => {
                console.log(res)
                console.log('退标器结束', state.controller.strState)
            })
            dispatch('closeCheckin')
        },
    },
}

// todo 重启 app 时，校验本机所有设备状态，所有设备正常，方可使用，否则即设备异常提示（全局蒙版，可以进入设备调试页面）
// todo 开发设备调试页
export default returnBox
