/** 读卡器模块 */
import router from '@/router'

/** helpers */
import { log } from '@/libs/treasure'
import { Message } from 'view-design'
import { setToken } from '@/libs/util'

/** constant */
import {
    API,
    STATUS,
    TIMEOUT,
    LOGIC_NAME,
    confirmOpen,
    confirmHealthy,
} from '@/store/bussiness/common'

/** 接口 */
import {
    supplyBaseCall,
    userLoginCall,
    userLogoutCall,
} from '@/api/bussiness/user'

const EQUIPMENT_NAME = '读卡器'
const xLog = log.bind(null, EQUIPMENT_NAME)

export const USER_LOGIN_STATUS_NAME = 'userLogin'

function buildReadCardParams() {
    const removeSplit = str => str.replace('/,/g', '').replace(/ /g, '')
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
        code: '',
        info: {},
        checkoutLoading: false,
        takenCardCheckout: false,
        // todo 退标状态
        checkinLoading: false,
        takenCardCheckin: false,
        fromPath: '',
    },
    getters: {},
    mutations: {
        setUserCode(state, { code }) {
            state.code = code
        },
        setUserInfo(state, { info }) {
            state.info = info
        },
        setIdc(state, idc) {
            state.controller = idc
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
        // 取消放卡监听
        // async cancelInsert({ state }) {
        //     const { ret } = await state.controller[API.CANCEL_INSERT]()
        //     xLog('取消读卡', ret)
        // },

        /** hardware */
        async idcHealthy({ state }) {
            try {
                await confirmOpen(state, EQUIPMENT_NAME, LOGIC_NAME.IDC)
                await confirmHealthy(state, EQUIPMENT_NAME)
                return true
            } catch ({ message }) {
                Message.error({
                    content: `${message}`,
                    closable: true,
                })
                return false
            }
        },

        // 监听放卡
        async forInsert({ dispatch, state }) {
            state.controller[API.CONNECT](
                LOGIC_NAME.CHECKIN,
                TIMEOUT.CONNECT,
                (ret, a, b, c) => {
                    console.log(ret, a, b, c)
                    const status = state.controller.strState
                    console.log(status)
                }
            )

            /** 1. 设备状态确认 */
            const checkoutStatus = await dispatch('idcHealthy')
            if (!checkoutStatus) {
                return router.push('/user/crossroad')
            }

            /** 2. 灯光打开 */
            const openTimeId = setTimeout(dispatch, 2000, 'lightIdc')

            /** 3. 开始监听放卡 */
            const { ret } = await state.controller[API.INSERT](
                LOGIC_NAME.IDC_TRACK_MAP,
                TIMEOUT.INSERT,
                // 回调会在在放卡时和放卡后被触发
                evt => xLog('《==<-- 读卡监听的回调值 -->==>', evt)
            )

            /** 2. 灯光关闭 */
            clearTimeout(openTimeId)
            setTimeout(dispatch, 1000, 'closeIdc')

            /** 4. 监听到放卡后流程 */
            // error 1 超时返回 crossroad 页
            if (ret === STATUS.TIMEOUT) {
                if (router.app.$route.path === '/user/login') {
                    Message.warning({
                        content: '未在指定时间内放卡',
                        closable: true,
                    })
                    return router.push('/user/crossroad')
                }

                return
            }

            // error 2 除了超时外的异常
            if (ret !== STATUS.CARD_ACCEPTED) {
                return router.push('/user/crossroad').then(() =>
                    Message.warning({
                        content: `读卡器异常：${ret}`,
                        closable: true,
                        duration: 5,
                    })
                )
            }

            try {
                await dispatch('reading')
            } catch (e) {
                return Message.warning(e.message)
            }
            dispatch('forEject')
        },
        // 监听取卡
        async forEject({ state, dispatch }) {
            xLog('取卡监听将会持续', TIMEOUT.EJECT / 60 / 1000, '分钟')
            const { ret } = await state.controller[API.EJECT](TIMEOUT.EJECT)

            if (ret === STATUS.CARD_TAKEN || ret === STATUS.TIMEOUT) {
                return dispatch('takeIcCardCb')
            }

            console.error(`取卡监听返回异常（${ret}）`)
        },
        // 读卡
        async reading({ dispatch, state }) {
            const res = await state.controller[API.READ](
                ...buildReadCardParams(),
                TIMEOUT.READ
            )

            xLog('读卡结果', res)
            // todo 返回结果异常返回首页

            // 返回值处理获取 code
            const digitalCode = JSON.parse(res.param).Data
            const code = String.fromCodePoint(...digitalCode).substr(23, 22)
            if (!code) {
                router.push('/user/crossroad')
                throw new Error('读卡异常，请重试！')
            }
            dispatch('getIcCardCodeCb', code)
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
                Message.error('在发标过程中茶农卡被取走')
                return
            }

            // todo 退标过程中取走茶农卡

            router.push('/user/crossroad')
            // 清除登录状态、用户信息
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

                // 获取茶农标量
                dispatch('getUserCurrentNumber')

                // 获取茶农信息
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
        // 用户信息获取
        async getUserInfo({ commit }, equ_user_code) {
            const params = { equ_user_code }
            const { obj } = await supplyBaseCall(params)
            commit({
                type: 'setUserInfo',
                info: obj,
            })
        },
    },
}

export default cardReader
