/**
 * 用户登录模块，包含：
 * 读卡器控制器
 * 用户登录退出逻辑
 * 流程图见：cardReader_process.jpg
 */

import router from '@/router'

/** helpers */
import { log, speakMsg } from '@/libs/treasure'
import { Message } from 'view-design'
import { setToken } from '@/libs/util'
import EventNotifiers from '@/store/bussiness/EventNotifiers'

/** constant */
import {
    API,
    STATUS,
    TIMEOUT,
    LOGIC_NAME,
    pResRej,
    backHome,
} from '@/store/bussiness/common'

/** api */
import {
    supplyBaseCall,
    userLoginCall,
    userLogoutCall,
} from '@/api/bussiness/user'

/** module constant */
const _NAME = '读卡器'
const _NAME_ENG = 'CardReader'
const _NAME_LOGIC = LOGIC_NAME.IDC
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)
export const USER_LOGIN_STATUS_NAME = 'userLogin'

/**
 * buildReadCardParams
 * @desc 返回读卡器读卡时的参数
 * @returns {(string|number|*)[]}
 */
function buildReadCardParams() {
    const removeSplit = (str) => str.replace('/,/g', '').replace(/ /g, '')
    const token = '?'
    const protocol = 0
    const bytes =
        '2270617373776461223a20222041364434433942424533463220222c202270617373776462223a2022222c2022736563746f72223a202235222c2022626c6f636b223a20223222'
    return [token, protocol, removeSplit(bytes)]
}

let subscriber

const cardReader = {
    state: {
        controller: {},
        code: '',
        info: {},
        /**
         * 领标时
         * 用于防止茶农卡被取走
         * checkoutLoading：正在出标
         * takenCardCheckout：出标时卡被取走
         */
        checkoutLoading: false,
        takenCardCheckout: false,
        /**
         * 退标时
         * 用于防止茶农卡被取走
         * checkinLoading：正在退标
         * takenCardCheckin：退标时卡被取走
         */
        checkinLoading: false,
        takenCardCheckin: false,
        /**
         * 状态节点
         * 标记注入
         * 标记读卡器打开
         */
        statusNodes: {
            inject: false,
            open: false,
        },
        /**
         * 流程节点
         * 等待放卡
         * 等待读卡
         * 等待拿卡
         */
        processNodes: {
            forPut: false,
            forRead: false,
            forTake: false,
        },
        /**
         * 目标页：QWebBridge 已连接
         * 用于登录后保持跳转
         */
        fromPath: '',
        /**
         * 目标页：QWebBridge 未连接
         * 用于 QWebBridge 连接，CardReader 打开后保持跳转
         */
        toPath: undefined,
    },
    getters: {},
    mutations: {
        // 控制器初始化
        // 发布订阅中心初始化
        [_INIT_](state, controller) {
            state.controller = controller
            subscriber = new EventNotifiers(state.controller)

            // 状态登记
            state.statusNodes.inject = true
        },
        setUserCode(state, { code }) {
            state.code = code
        },
        setUserInfo(state, { info }) {
            state.info = info
        },
        setCheckoutLoading(state, status) {
            state.checkoutLoading = status
        },
        setTakenCardCheckout(state, status) {
            state.takenCardCheckout = status
        },
        setCheckinLoading(state, status) {
            state.checkinLoading = status
        },
        setTakenCardCheckin(state, status) {
            state.takenCardCheckin = status
        },
        setFromPath(state, path) {
            state.fromPath = path
        },
        resetCardReader(state) {
            state.code = ''
            state.info = {}
            state.checkoutLoading = false
            state.takenCardCheckout = false
            state.checkinLoading = false
            state.takenCardCheckin = false
            state.fromPath = ''
        },
        transferStatus(state, [node, status = true]) {
            Object.keys(state.processNodes).forEach(
                (key) => (state.processNodes[key] = false)
            )
            node && (state.processNodes[node] = status)
        },
        setToPath(state, toPath) {
            state.toPath = toPath
        },
    },
    actions: {
        /** hardware **/
        // 打开读卡器
        [_OPEN_]({ state, dispatch, commit }) {
            subscriber.removeAll()

            /** 注册所有事件 **/

            /**
             * OpenCompleted
             * 连接读卡器：无设备也可以连接，不会报异常
             * 首次连接时才会触发
             */
            let isFirst = false
            subscriber.add('OpenCompleted', (res) => {
                xLog('OpenCompleted    回调，返回值：', res)
                isFirst = true
            })

            /**
             * ConnectionOpened
             * 首次连接和再次连接均会被调用
             * 首次连接时会调用 8 次，具体看图片：cardReader_websocket_open.png
             */
            let count = 0
            subscriber.add('ConnectionOpened', (res) => {
                xLog('ConnectionOpened 回调，返回值：', res)
                isFirst || (state.statusNodes.open = true)

                /** 重连后页面跳转 todo 调用 8 次行为是否稳定 */
                count++
                if (count === 8) {
                    state.statusNodes.open = true
                    setTimeout(() => {
                        xLog(JSON.parse(state.controller.strState))

                        // 重连成功时会存在目标路径
                        if (state.toPath) {
                            router
                                .push(state.toPath)
                                .then(() => commit('setToPath', undefined))
                        }
                    }, 99)
                }
            })

            /**
             * DeviceError | FatalError
             * 异常监听：
             * 因为使用前有设备状态查询，这两个回调使用较少
             */
            subscriber.add('DeviceError', (res) => {
                xLog('DeviceError', res)
            })
            subscriber.add('FatalError', (res) => {
                xLog('FatalError', res)
            })

            /**
             * Timeout
             * 超时逻辑：
             * 等待放卡时，超时返回首页
             */
            subscriber.add('Timeout', (res) => {
                xLog('Timeout          回调，返回值：', res)
                if (state.processNodes.forPut) {
                    dispatch('closeIdcLight')
                    speakMsg('warning', '未在指定时间内放卡')
                    return backHome()
                }
            })

            // 等待放卡
            // 回调执行顺序：
            // 1. 传入的回调函数，在此函数最下面
            // 2. CardInserted
            // 3. ChipDataReceived: WFS_CMD_IDC_READ_RAW_DATA WFS_CMD_IDC_CHIP_IO
            // 4. CardAccepted
            subscriber.add('CardInserted', (res) => {
                dispatch('closeIdcLight')
                xLog('CardInserted     回调，返回值：', res)
            })
            subscriber.add('ChipDataReceived', (res) => {
                xLog('ChipDataReceived 回调，返回值：', res)
            })
            subscriber.add('CardAccepted', (res) => {
                xLog('CardAccepted     回调，返回值：', res)
                commit('transferStatus', ['forRead'])
                dispatch('read')
            })

            // 卡被取走：等待放卡超时会被调用
            subscriber.add('CardTaken', (res) => {
                xLog('CardTaken        回调，返回值：', res)
                if (state.processNodes.forTake) {
                    dispatch('takeIcCardCb')
                }
                commit('transferStatus', [])
            })

            // 非法卡
            subscriber.add('CardInvalid', (res) => {
                xLog('CardInvalid      回调，返回值：', res)
                Message.destroy()
                speakMsg('error', '请使用茶农卡登录')
                commit('transferStatus', [])
                return backHome()
            })

            state.controller[API.CONNECT](_NAME_LOGIC, TIMEOUT.CONNECT)
        },
        // 读卡器状态检查
        [_CHECK_]({ state }) {
            const stateJson = state.controller.strState
            let o = null
            try {
                o = JSON.parse(stateJson)
                xLog('状态', o)
            } catch (e) {
                return Promise.reject(`${_NAME}状态解析异常`)
            }
            if (o.StDeviceStatus !== STATUS.HEALTHY) {
                return Promise.reject(`${_NAME}状态：${o.StDeviceStatus}`)
            }

            return Promise.resolve()
        },
        // 监听放卡
        addEventListenerPut({ state, commit }) {
            const { p, res, rej } = pResRej()

            state.controller[API.INSERT](
                LOGIC_NAME.IDC_TRACK_MAP,
                TIMEOUT.INSERT,
                (ret) => {
                    if (ret === '0') {
                        commit('transferStatus', ['forPut'])
                        res()
                    } else {
                        rej()
                    }
                }
            )

            return p
        },
        // 读卡
        read({ state, dispatch, commit }) {
            state.controller[API.READ](
                ...buildReadCardParams(),
                TIMEOUT.READ,
                (resJson) => {
                    let res
                    try {
                        res = JSON.parse(resJson)
                    } catch (e) {
                        console.error('卡内容无法解析', e)
                        return backHome()
                    }

                    const { sResult, Data } = res
                    if (sResult === 0) {
                        const codeStr = String.fromCodePoint(...Data)
                        const code = codeStr.substr(23, 22)
                        if (code === '') {
                            Message.error('无效卡')
                            return backHome()
                        }
                        commit('transferStatus', ['forTake'])
                        dispatch('getIcCardCodeCb', code)
                    } else {
                        console.error(
                            '读卡异常',
                            'sResult',
                            sResult,
                            'Data',
                            Data
                        )
                        return backHome()
                    }
                }
            )
        },
        // 执行读卡操作
        async forInsert({ dispatch }) {
            /** 1. 检查读卡器 */
            try {
                await dispatch('isCardReaderOk')
            } catch (e) {
                console.error(e)
                Message.error('读卡器异常，本机暂时无法为您提供服务。')
                return
            }

            /** 2. 开始监听放卡及灯光提示 */
            try {
                dispatch('lightIdc')
                await dispatch('addEventListenerPut')
            } catch (e) {
                // 灯光关闭
                dispatch('closeIdcLight')
                Message.error('监听放卡异常')
                return backHome()
            }
        },

        /** hardware -> business **/
        // 读卡完成
        getIcCardCodeCb({ dispatch }, ic_code) {
            dispatch('userLogin', ic_code)
        },
        // 取卡完成
        takeIcCardCb({ commit, dispatch, state }) {
            // 发标过程中取走茶农卡
            if (state.checkoutLoading) {
                commit('setTakenCardCheckout', true)
                speakMsg('error', '在领标过程中茶农卡被取走')
                return
            }

            // 退标过程中取走茶农卡
            if (state.checkinLoading) {
                commit('setTakenCardCheckin', true)
                speakMsg('error', '在退标过程中茶农卡被取走')
                return
            }

            router.push('/user/crossroad')
            dispatch('userLogout')
        },

        /** business **/
        // 登录
        async userLogin({ commit, dispatch, state }, ic_code) {
            const params = { ic_code }
            try {
                const {
                    msg,
                    obj: { equ_user_code },
                } = await userLoginCall(params)

                // cookie 添加已登录标识符
                setToken(USER_LOGIN_STATUS_NAME)

                // 保存茶农 code
                commit({
                    type: 'setUserCode',
                    code: equ_user_code,
                })

                /** 缓存信息获取 */
                // 0. 获取茶农标量
                dispatch('getUserCurrentNumber')
                // 1. 获取签名数据
                dispatch('getSignStatus')
                // 2. 获取领和退开放状态
                dispatch('getCheckoutCheckinStatus', true)

                /** 获取茶农信息 */
                dispatch('getUserInfo', equ_user_code)

                // 登录操作时，跳转且提示
                const isLoginPage = router.app.$route.path === '/user/login'
                if (isLoginPage) {
                    Message.destroy()
                    Message.success({
                        content: msg,
                        duration: 1.5,
                    })
                    // 直接去目标页面
                    const target = state.fromPath || '/user/crossroad'
                    router.push(target).then(() => commit('setFromPath', ''))
                }
            } catch (e) {
                router
                    .push('/user/crossroad')
                    .then(() => console.error('茶农卡异常'))
            }
        },
        // 用户信息获取
        async getUserInfo({ commit }, equ_user_code) {
            const params = { equ_user_code }
            const { obj } = await supplyBaseCall(params)
            commit({
                type: 'setUserInfo',
                info: obj,
            })
        },
        // 退出
        async userLogout({ commit, state }) {
            const equ_user_code = state.code

            // cookie 去除已登录标识符
            setToken('')

            /** cardReader vuex 数据重置 */
            commit('resetCardReader')

            /** checkin vuex 数据重置 */
            commit('resetCheckin')

            /** cache vuex 数据重置 */
            commit('resetCache')

            const params = { equ_user_code }
            const { msg } = await userLogoutCall(params)
            Message.info({
                content: msg || '已取卡退出',
                closable: true,
            })
        },
    },
}

export default cardReader
