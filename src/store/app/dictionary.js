/**
 * vuex sysDd module
 * 缓存项目请求过的字典表
 */

import Vue from 'vue'
import { sysDdCall } from '@/api/app/sys'

const DEFAULT_SYS_DD_PARAMS = {
    key: '',
    addTreeNode: 1,
    plistvalue: '',
    selFirst: '',
    listValues: '',
}

const dictionary = {
    state: {
        sysDd: {},
    },
    getters: {
        curSysDd: state => ddKeys =>
            Object.values(ddKeys).reduce((acc, ddKey) => {
                acc[ddKey] = state.sysDd[ddKey]
                return acc
            }, {}),
    },
    mutations: {
        addSysDd(state, { key, d }) {
            Vue.set(state.sysDd, key, d)
        },
    },
    actions: {
        suitSysDd({ dispatch, state }, key) {
            if (key in state.sysDd) {
                return
            }
            dispatch('getSysDd', key)
        },
        async getSysDd({ commit }, key) {
            if (typeof key === 'string') {
                key = { key }
            }
            const params = {}
            Object.assign(params, DEFAULT_SYS_DD_PARAMS, key)
            const { obj } = await sysDdCall(params)
            const d = obj.map(({ key, value }) => ({
                label: value,
                value: isNaN(Number(key)) ? key : Number(key),
            }))
            commit({
                type: 'addSysDd',
                key: params.key,
                d,
            })
        },
    },
}

export default dictionary
