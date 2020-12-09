/**
 * 设备信息：使用设备 MAC 地址向服务器获取
 * 时机：项目加载后，后台静默完成
 * 顺序：
 *  1. 向设备获取基本信息
 *  2. 登陆时向服务器请求设备信息，保存于 store
 *  3. 登陆时向服务器请求盒子信息，保存于 store
 */
import store from '../index'

/** helpers */
import { log } from '@/libs/treasure'
import { getToken } from '@/libs/util'
import { getEquipmentInfoCall, getBoxInfoCall } from '@/api/bussiness/equipment'
import { WEBSOCKET_ADDRESS } from '@/config'
import { pResRej, API } from '@/store/bussiness/common'
import { Message } from 'view-design'
import { NEED_EQUIPMENT_PAGE_ARR } from '@/router/routerGuard'
import router from '@/router'

/** API */
import { ADMIN_LOGIN_STATUS_NAME, login, logout } from '@/api/app/user'

const equipment = {
    state: {
        /**
         * 正在连接到 QWebBridge
         */
        connecting: true,
        /**
         * 是否连接到 QWebBridge
         */
        connected: false,
        /**
         * 初始化 QWebChannel 的返回值
         * 由 QWebBridge.exe 程序返回
         */
        qtObjects: {},
        /**
         * 设备信息（设备端取）：设备接口获取
         */
        equipmentBase: {
            mac: '',
        },
        /**
         * 设备信息（服务器端）：服务器接口获取
         */
        equipmentInfo: {},
        /**
         * 设备盒子信息：服务器接口获取
         */
        boxInfo: [],
    },
    getters: {
        // 设备编号
        equipmentCode(state) {
            return state.equipmentInfo.equipment_code
        },
        // 领标模块
        takeBox(state) {
            return (boxType) =>
                state.boxInfo.filter((box) => box.box_type === boxType)
        },
    },
    mutations: {
        setConnecting(state, status) {
            state.connecting = status
        },
        setConnectStatus(state, status) {
            state.connected = status
        },
        setQtObjects(state, qtObjects) {
            state.qtObjects = qtObjects
        },
        setEquipmentBase(state, equipmentBase) {
            state.equipmentBase = equipmentBase
        },
        setEquipmentInfo(state, { equipmentInfo }) {
            state.equipmentInfo = equipmentInfo
        },
        setBoxInfo(state, { boxInfo }) {
            state.boxInfo = boxInfo
        },
    },
    actions: {
        async connect({ state, commit }) {
            const { p, res, rej } = pResRej()

            const open = () => {
                res(socket)
            }
            const close = () => {
                if (state.connected) {
                    Message.warning('与 QWebBridge 连接断开')
                    commit('setConnectStatus', false)

                    // todo 需要设备页
                }
            }
            const error = (evt) => {
                rej(evt)
            }
            const message = (evt) => {
                log('websocket message', evt)
            }

            const socket = new WebSocket(WEBSOCKET_ADDRESS)
            socket.addEventListener('open', open)
            socket.addEventListener('close', close)
            socket.addEventListener('error', error)
            // socket.addEventListener('message', message)
            return p
        },
        async initQWebChannel({ dispatch }, socket) {
            const { p, res, rej } = pResRej()

            try {
                new QWebChannel(socket, res)
            } catch (e) {
                rej(e)
            }

            return p
        },
        async getMac({ state }) {
            const { p, res, rej } = pResRej()

            try {
                state.qtObjects.common[API.GET_MAC](res)
            } catch (e) {
                rej(e)
            }

            return p
        },
        setController({ state, commit, dispatch }) {
            const controllers = {
                // 读卡器
                CardReader: 'idc',
                // 领标器
                Checkout: 'chkout',
                // 退标器
                Checkin: 'chkin',
                // 指示灯
                GuideLight: 'glt',
                // 打印器
                Printer: 'rec',
                // 输入法
                Ime: 'ime',
                // 感应器
                Sensor: 'snr',
            }
            Object.keys(controllers).forEach((key) => {
                const controller = state.qtObjects[controllers[key]]
                const type = `set${key}ControllerSubscriber`
                commit(type, controller)
            })
            // Object.keys(controllers).forEach((key) => dispatch(`open${key}`))
            // todo 同时打开，逐一上报
            dispatch('openCardReader')
            dispatch('openCheckout')
            // dispatch('startSensor')
            // dispatch('isCardReaderOk')
            // dispatch('isCheckoutOk')
            // dispatch('isCheckinOk')
            // dispatch('isPrinterOk')

            // todo 定时上报

            // 感应器开始监听
            // setTimeout(() => {
            //     dispatch('startSensor')
            // }, 2000)
        },
        async initX({ dispatch, commit, state }) {
            commit('setConnecting', true)

            /** 1. websocket */
            let socket
            try {
                socket = await dispatch('connect')
                log('QWebBridge 已连接')
            } catch (e) {
                commit('setToPath', undefined)
                commit('setConnecting', false)

                Message.destroy()
                Message.error('QWebBridge 连接失败')
                console.error('QWebBridge 连接失败', e)
                return
            }

            /** 2. QWebChannel */
            try {
                const { objects } = await dispatch('initQWebChannel', socket)
                commit('setConnectStatus', true)
                commit('setQtObjects', objects)
                log('QWebChannel 初始化完成')
            } catch (e) {
                commit('setToPath', undefined)

                Message.destroy()
                Message.error('QWebChannel 初始化失败')
                console.error('QWebChannel 初始化失败', e)
                return
            } finally {
                commit('setConnecting', false)
            }

            /** 3. mac */
            try {
                const macInfo = await dispatch('getMac')
                const mac = JSON.parse(macInfo)['MACINFO'][0]['MACADDRESS']
                commit('setEquipmentBase', { mac })

                // 管理员已登录，获取设备信息和盒子信息
                if (getToken() === ADMIN_LOGIN_STATUS_NAME) {
                    dispatch('getEquipmentInfo')
                    dispatch('getBoxInfo')
                }
                log('Mac 获取完成')
            } catch (e) {
                Message.error('Mac 获取失败')
                console.error('Mac 获取失败', e)
                return
            }

            /** 4. controller */
            dispatch('setController')
        },
        async getEquipmentInfo({ commit }) {
            const { obj } = await getEquipmentInfoCall({})
            const equipmentInfo = obj
            commit({
                type: 'setEquipmentInfo',
                equipmentInfo,
            })
        },
        async getBoxInfo({ commit }) {
            const { obj } = await getBoxInfoCall({})
            const boxInfo = obj
            commit({
                type: 'setBoxInfo',
                boxInfo,
            })
        },
        async adminLogin({ dispatch }, data) {
            await login(data)
            dispatch('getEquipmentInfo')
            dispatch('getBoxInfo')
        },
        async adminLogout({ commit }) {
            await logout()
            commit({
                type: 'setEquipmentInfo',
                equipmentInfo: {},
            })
            commit({
                type: 'setBoxInfo',
                equipmentInfo: {},
            })
        },
    },
}

export default equipment
