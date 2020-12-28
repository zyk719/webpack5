/**
 * 设备信息：使用设备 MAC 地址向服务器获取
 * 时机：项目加载后，后台静默完成
 * 顺序：
 *  1. 向设备获取基本信息
 *  2. 登陆时向服务器请求设备信息，保存于 store
 *  3. 登陆时向服务器请求盒子信息，保存于 store
 */

/** helpers */
import { cLog, log } from '@/libs/treasure'
import { getToken } from '@/libs/util'
import { getEquipmentInfoCall, getBoxInfoCall } from '@/api/bussiness/equipment'
import { WEBSOCKET_ADDRESS } from '@/config'
import {
    API,
    CONTROLLERS,
    reportEquipmentStatusInterval,
} from '@/store/bussiness/common'
import { Message } from 'view-design'

/** API */
import { ADMIN_LOGIN_STATUS_NAME, login, logout } from '@/api/app/user'

const equipment = {
    state: {
        // 正在连接到 QWebBridge
        connecting: true,
        // 是否连接到 QWebBridge
        connected: false,
        // 初始化 QWebChannel 的返回值，由 QWebBridge.exe 程序返回
        qtObjects: {},
        // 设备 mac 地址
        mac: '',
        // 设备信息（服务器端）：服务器接口获取
        equipmentInfo: {},
        // 设备盒子信息：服务器接口获取
        boxInfo: [],
    },
    getters: {
        // 设备编号
        equipmentCode(state) {
            return state.equipmentInfo['equipment_code']
        },
        // 领标模块
        takeBox(state) {
            return (boxType) =>
                state.boxInfo.filter((box) => box['box_type'] === boxType)
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
        setMac(state, mac) {
            state.mac = mac
        },
        setEquipmentInfo(state, equipmentInfo) {
            state.equipmentInfo = equipmentInfo
        },
        setBoxInfo(state, boxInfo) {
            state.boxInfo = boxInfo
        },
    },
    actions: {
        /** hardware **/
        async connect({ state, commit }) {
            return new Promise((res, rej) => {
                const open = () => res(socket)

                const close = () => {
                    if (state.connected) {
                        Message.error('与 QWebBridge 连接断开')
                        commit('setConnectStatus', false)

                        // todo 需要设备页
                    }
                }

                const socket = new WebSocket(WEBSOCKET_ADDRESS)
                socket.addEventListener('open', open)
                socket.addEventListener('close', close)
                socket.addEventListener('error', rej)

                // const message = (evt) => log('websocket message', evt)
                // socket.addEventListener('message', message)
            })
        },
        async initQWebChannel({ dispatch }, socket) {
            return new Promise((resolve, reject) => {
                try {
                    // ⚠️ QWebChannel 通过 QWebChannel.js 全局挂载
                    new window.QWebChannel(socket, resolve)
                } catch (e) {
                    cLog('⚠️ 初始化 QWebChannel 异常', 'red', e)
                    reject(e)
                }
            })
        },
        async getMac({ state }) {
            return new Promise((resolve, reject) => {
                try {
                    state.qtObjects['common'][API.GET_MAC](resolve)
                } catch (e) {
                    reject(e)
                }
            })
        },
        setController({ state, commit, dispatch }) {
            // 设置控制器
            Object.keys(CONTROLLERS).forEach((key) => {
                const controller = state.qtObjects[CONTROLLERS[key]]
                const type = `set${key}ControllerSubscriber`
                commit(type, controller)
            })

            // 打开设备管理器
            dispatch('openCardReader')
            dispatch('openCheckout')
            dispatch('openCheckin')
            // dispatch('openCheckout2')
            // dispatch('openCheckout3')
            dispatch('openPrinter')
            dispatch('openGuideLight')
            dispatch('openSensor')
            dispatch('openQr')
            dispatch('openDoor')

            // 定时上报
            setTimeout(reportEquipmentStatusInterval, 1000 * 10)
        },
        async initX({ dispatch, commit }) {
            commit('setConnecting', true)

            /** 1. websocket */
            let socket
            try {
                socket = await dispatch('connect')
                cLog('👌 QWebBridge', '#1890ff')
            } catch (e) {
                commit('setToPath', undefined)
                commit('setConnecting', false)

                Message.destroy()
                Message.error('QWebBridge 连接失败')
                cLog('⚠️ QWebBridge 连接失败', 'red', e)
                return
            }

            /** 2. QWebChannel */
            try {
                const { objects } = await dispatch('initQWebChannel', socket)
                cLog('👌 QWebChannel', '#1890ff')
                commit('setQtObjects', objects)

                commit('setConnectStatus', true)
                commit('setConnecting', false)
            } catch (e) {
                commit('setToPath', undefined)
                commit('setConnecting', false)

                Message.destroy()
                Message.error('QWebChannel 初始化失败')
                cLog('⚠️ QWebChannel 初始化失败', 'red', e)
                return
            }

            /** 3. mac */
            try {
                const macInfo = await dispatch('getMac')
                const mac = JSON.parse(macInfo)['MACINFO'][0]['MACADDRESS']
                commit('setMac', mac)
                cLog('👌 mac', '#1890ff')

                // ⚠️ 管理员已登录时，获取设备信息和盒子信息
                if (getToken() === ADMIN_LOGIN_STATUS_NAME) {
                    dispatch('getEquipmentInfo')
                    dispatch('getBoxInfo')
                }
            } catch (e) {
                Message.error('Mac 获取失败')
                cLog('⚠️ Mac 获取失败', 'red', e)
                return
            }

            /** 4. controller */
            dispatch('setController')
        },

        /** business 管理员端业务 **/
        async getEquipmentInfo({ commit }) {
            const { obj } = await getEquipmentInfoCall({})
            commit('setEquipmentInfo', obj)
        },
        async getBoxInfo({ commit }) {
            const { obj } = await getBoxInfoCall({})
            commit('setBoxInfo', obj)
        },
        async adminLogin({ dispatch }, data) {
            await login(data)
            dispatch('getEquipmentInfo')
            dispatch('getBoxInfo')
        },
        async adminLogout({ commit }) {
            await logout()
            commit('setEquipmentInfo', {})
            commit('setBoxInfo', {})
        },
    },
}

export default equipment
