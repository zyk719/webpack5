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
        sysDdCacheMapper: {},
    },
    getters: {
        curSysDd: (state) => (ddKeys) =>
            Object.values(ddKeys).reduce((acc, ddKey) => {
                acc[ddKey] = state.sysDd[ddKey]
                return acc
            }, {}),
    },
    mutations: {
        addSysDd(state, { key, d }) {
            Vue.set(state.sysDd, key, d)
        },
        addSysDdCacheMapper(state, { key, needCache }) {
            Vue.set(state.sysDdCacheMapper, key, needCache)
        },
    },
    actions: {
        suitSysDd({ dispatch, state }, { key, needCache = true }) {
            const cached = key in state.sysDd
            const isNeedCache = state.sysDdCacheMapper[key]
            if (cached && isNeedCache) {
                return
            }

            dispatch('getSysDd', { key, needCache })
        },
        async getSysDd({ commit }, { key, needCache }) {
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

            commit('addSysDd', { key: params.key, d })
            commit('addSysDdCacheMapper', { key: params.key, needCache })
        },
    },
}

export default dictionary
