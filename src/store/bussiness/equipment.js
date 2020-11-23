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

/** API */
import { login, logout } from '@/api/app/user'

const API = {
    GET_MAC: 'GetMacInfo',
}

// 初始化设备控制器
const initEquipment = (store) => {
    const idc = new window.ecjrjs.Idc(null, 'idc')
    store.commit('setIdc', idc)
    log('读卡器 >>> 初始化完成！')

    const checkout = new window.ecjrjs.CheckOut(null, 'chkout')
    store.commit('setCheckout', checkout)
    log('出标器 >>> 初始化完成！')

    const ime = window.qtObjects.ime
    store.commit('setIme', ime)
    log('输入法 >>> 初始化完成！')

    const glt = window.qtObjects.glt
    store.commit('setGlt', glt)
    log('灯光组 >>> 初始化完成！')

    const checkin = window.qtObjects.chkin
    store.commit('setCheckin', checkin)
    log('退标器 >>> 初始化完成！')

    const printer = window.qtObjects.rec
    store.commit('setPrinterController', printer)
    log('打印器 >>> 初始化完成！')

    // more...
}

const equipment = {
    state: {
        /**
         * 是否连接到 QWebBridge
         */
        connected: false,
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
        setConnectStatus(state, status) {
            state.connected = status
        },
        setEquipmentBase(state, { equipmentBase }) {
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
        async connectQWebBridge({ commit, dispatch }) {
            log('QWebBridge >>> 连接中...')
            // 异常通过全局捕获并提示
            await window.ecModule.init(window) /* 连接到 QWebBridge */
            log('QWebBridge >>> 已连接！')

            window.ecModule.traceOn(window)

            commit('setConnectStatus', true)
            await dispatch('getEquipmentBase')

            initEquipment(store)
        },
        async getEquipmentBase({ commit, dispatch }) {
            const equipmentBase = await new Promise((resolve) => {
                window.qtObjects.common[API.GET_MAC]((macInfo) => {
                    const mac = JSON.parse(macInfo)['MACINFO'][0]['MACADDRESS']
                    resolve({ mac })
                })
            })
            log('MAC >>> 已返回！')

            commit({
                type: 'setEquipmentBase',
                equipmentBase,
            })

            // 管理员已登录时调用用户信息和盒子信息
            if (getToken() === 'adminLogin') {
                dispatch('getEquipmentInfo')
                dispatch('getBoxInfo')
            }
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
