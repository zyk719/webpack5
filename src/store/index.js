import Vue from 'vue'
import Vuex from 'vuex'
import { SCREEN_SAVER_INTERVAL } from '@/config'

// 应用状态模块
import user from '@/store/app/user'
import dictionary from '@/store/app/dictionary'

// 业务状态模块
// 设备信息
import equipment from '@/store/bussiness/equipment'
// 读卡设备
import cardReader from '@/store/bussiness/cardReader'
// 领标设备
import checkout from '@/store/bussiness/checkout'
// 退标盒子
import returnBox from '@/store/bussiness/returnBox'
// 灯光设备
import guideLight from '@/store/bussiness/guideLight'
// 键盘
import ime from '@/store/bussiness/ime'
// 打印器
import printer from '@/store/bussiness/printer'
// 初始化数据
import cache from '@/store/bussiness/cache'
// 感应器
import sensor from '@/store/bussiness/sensor'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        screenSaver: false,
    },
    mutations: {
        toggleScreenSaver(state, status) {
            if (status) {
                const stateJson = state.sensor.controller.strState
                if (stateJson) {
                    const StProximityState = JSON.parse(stateJson)
                        .StProximityState
                    if (StProximityState === 'ON') {
                        setTimeout(() => {
                            state.screenSaver = status
                        }, SCREEN_SAVER_INTERVAL / 2)
                    } else if (StProximityState === 'OFF') {
                        ddaaa
                        document.body.click()
                    }
                }
                return
            }

            state.screenSaver = status
        },
    },
    actions: {},
    modules: {
        user,
        dictionary,
        equipment,
        customer: cardReader,
        checkout,
        returnBox,
        ime,
        cache,
        guideLight,
        printer,
        sensor,
    },
})
