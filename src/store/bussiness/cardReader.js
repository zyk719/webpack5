/** 读卡器模块 */
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
import { TYPE_IDC, STATUS_OK, STATUS_ERROR } from '@/libs/constant'

/** 接口 */
import {
    supplyBaseCall,
    userLoginCall,
    userLogoutCall,
} from '@/api/bussiness/user'

const _TYPE = TYPE_IDC
const _NAME = '读卡器'
const _NAME_ENG = 'CardReader'
const _NAME_LOGIC = LOGIC_NAME.IDC
const _INIT_ = `set${_NAME_ENG}ControllerSubscriber`
const _OPEN_ = `open${_NAME_ENG}`
const _LOOK_ = `take${_NAME_ENG}State`
const _CHECK_ = `is${_NAME_ENG}Ok`
const xLog = log.bind(null, _NAME)

export const USER_LOGIN_STATUS_NAME = 'userLogin'

function buildReadCardParams() {
    const removeSplit = (str) => str.replace('/,/g', '').replace(/ /g, '')
    const token = '?'
    const protocol = 0
    const bytes =
        '2270617373776461223a20222041364434433942424533463220222c202270617373776462223a2022222c2022736563746f72223a202235222c2022626c6f636b223a20223222'
    return [token, protocol, removeSplit(bytes)]
}

// read(get code) => login(get userCode) => userInfo
const cardReader = {
    state: {
        controller: {},
        subscriber: {},
        code: '',
        info: {},
        checkoutLoading: false,
        takenCardCheckout: false,
        checkinLoading: false,
        takenCardCheckin: false,
        fromPath: '',
    },
    getters: {},
    mutations: {
        [_INIT_](state, controller) {
            state.controller = controller
            state.subscriber = new EventNotifiers(state.controller)
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
    },
    actions: {
        /** hardware */
        [_OPEN_]({ state }) {
            const { p, res, rej } = pResRej()
            state.subscriber.removeAll()
            /** todo 注册所有事件 */

            // success
            state.subscriber.add('OpenCompleted', res)
            state.subscriber.add('ConnectionOpened', res)

            // error
            state.subscriber.add('DeviceError', () =>
                rej(`${_NAME}打开：'DeviceError'`)
            )
            state.subscriber.add('FatalError', () =>
                rej(`${_NAME}打开：'FatalError'`)
            )
            state.subscriber.add('Timeout', () =>
                rej(`${_NAME}打开：'Timeout'`)
            )

            // business waiting for card
            // 回调执行顺序：
            // 1. 传入的回调函数，在此函数最下面
            // 2. CardInserted
            // 3. ChipDataReceived: WFS_CMD_IDC_READ_RAW_DATA
            // 4. CardAccepted
            state.subscriber.add('CardInserted', res)
            state.subscriber.add('ChipDataReceived', res)
            state.subscriber.add('CardAccepted', res)

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

        // 监听放卡
        addEventListenerPut({ state }) {
            const { p, res, rej } = pResRej()

            state.subscriber.removeAll()

            /** success */
            // 正确回调执行顺序：
            // 1. 传入的回调函数，在此函数最下面
            // 2. CardInserted
            // 3. ChipDataReceived: WFS_CMD_IDC_READ_RAW_DATA
            // 4. CardAccepted
            state.subscriber.add('CardInserted', res)
            state.subscriber.add('ChipDataReceived', res)
            state.subscriber.add('CardAccepted', res)

            /** equipment error */
            state.subscriber.add('FatalError', () =>
                rej('读卡器异常：FatalError')
            )
            state.subscriber.add('DeviceError', () =>
                rej('读卡器异常：DeviceError')
            )

            /** timeout */
            state.subscriber.add('Timeout', () => rej('未在指定时间内放卡'))

            /** Invalid */
            state.subscriber.add('CardInvalid', () => rej('请放置正确的茶农卡'))

            state.controller[API.INSERT](
                LOGIC_NAME.IDC_TRACK_MAP,
                TIMEOUT.INSERT
                // (ret) => xLog(ret)
            )

            return p
        },
        // 读卡
        read({ state, dispatch }) {
            const { p, res, rej } = pResRej()

            state.subscriber.removeAll()

            /** success(目前未用到，先注释) */
            // 返回值：WFS_CMD_IDC_READ_RAW_DATA、WFS_CMD_IDC_CHIP_IO
            // state.subscriber.add('ChipDataReceived')

            /** failed */
            state.subscriber.add('Timeout', rej)
            state.subscriber.add('DeviceError', rej)
            state.subscriber.add('FatalError', rej)
            /** 卡被取走 */
            state.subscriber.add('CardTaken', () => {
                dispatch('takeIcCardCb')
            })

            state.controller[API.READ](
                ...buildReadCardParams(),
                TIMEOUT.READ,
                res
            )

            return p
        },
        // 执行读卡操作
        async forInsert({ dispatch }) {
            /** 1. 检查读卡器 */
            try {
                await dispatch('isCardReaderOk')
            } catch (e) {
                Message.warning('读卡器异常，本机暂时无法为您提供服务。')
                return
            }

            /** 2. 开始监听放卡及灯光提示 */
            let lightTimeId
            try {
                lightTimeId = setTimeout(dispatch, 2000, 'lightIdc')
                await dispatch('addEventListenerPut')
            } catch (e) {
                Message.warning(e)
                return backHome()
            } finally {
                // 灯光关闭
                clearTimeout(lightTimeId)
                setTimeout(dispatch, 1000, 'closeIdc')
            }

            /** 3. 读卡 */
            try {
                const res = await dispatch('read')
                try {
                    const digitalCode = JSON.parse(res).Data
                    const codeStr = String.fromCodePoint(...digitalCode)
                    const code = codeStr.substr(23, 22)
                    if (code === '') {
                        Message.error('无效卡')
                        return backHome()
                    }
                    dispatch('getIcCardCodeCb', code)
                } catch (e) {
                    console.error('卡内容无法解析')
                    return backHome()
                }
            } catch (e) {
                Message.error('读卡异常')
                return backHome()
            }
        },

        /** hardware -> business */
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

        /** business */
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
