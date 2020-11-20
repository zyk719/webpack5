import Vue from 'vue'
import Vuex from 'vuex'

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

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        screenSaver: false,
    },
    mutations: {
        toggleScreenSaver(state, status) {
            state.screenSaver = status
        },
    },
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
    },
})
