import Axios from 'axios'

import store from '@/store'

import { equipmentStatus } from '@/api/bussiness/user'
import { isDev, log, speakMsg } from '@/libs/treasure'
import { getToken, setToken } from '@/libs/util'

export const VERSION_CACHE_NAME = 'aioVersion'
export const USER_LOGIN_STATUS_NAME = 'userLogin'
export const ADMIN_LOGIN_STATUS_NAME = 'adminLogin'

// 需硬件准备好的网页
export const NEED_EQUIPMENT_PAGE_ARR = [
    '/user/login',
    '/user/supply',
    '/user/number',
    '/user/back',
    '/user/sign',
    '/user/supply_pack',
    '/user/evaluation',
    '/admin/login',
    '/admin/crossroad',
    '/admin/put_tea_sign',
    '/admin/take_tea_sign',
    '/admin/take_tea_sign_back',
    '/admin/log',
]

// 需要无故障的页面：向服务器确认
export const NEED_AIO_OK_PAGE_ARR = [
    '/user/login',
    '/user/supply',
    '/user/number',
    '/user/back',
    '/user/sign',
    '/user/supply_pack',
    '/user/evaluation',
    '/admin/put_tea_sign',
    '/admin/take_tea_sign',
    '/admin/take_tea_sign_back',
]

/**
 * 拉取版本信息
 * @returns {Promise<*>}
 */
const getVersion = async () => {
    const {
        data: { version },
    } = await Axios.get('./version.json', {
        headers: {
            'Cache-Control': 'no-cache',
        },
    })
    return version
}

/**
 * 检测更新
 * @param to
 * @param from
 * @returns {Promise<void>}
 */
export const updateVersion = async (to, from) => {
    if (isDev) {
        return
    }

    if (from.name === null) {
        getVersion().then((version) =>
            localStorage.setItem(VERSION_CACHE_NAME, version)
        )
        return
    }

    if (!to.meta.requiresAuth && !getToken()) {
        const version = localStorage.getItem(VERSION_CACHE_NAME)

        // 主要场景是前往登录页时的更新检测，需要在进入登录页前刷新
        if (to.path === 'user/login') {
            try {
                const curVer = await getVersion()
                version !== curVer && window.location.reload()
            } catch {
                /* 版本检查失败不能影响正常功能 */
            }
        } else {
            getVersion().then(
                (curVer) => version !== curVer && window.location.reload()
            )
        }
    }
}

/**
 * 是否重置应用
 * 刷新时，to.path 代表当前页
 * @param to
 * @param from
 * @param next
 * @returns {boolean}
 */
export const resetApp = (to, from, next) => {
    if (from.name !== null) {
        return false
    }

    if (!to.path.startsWith('/user/')) {
        return false
    }

    if (getToken() === USER_LOGIN_STATUS_NAME) {
        setToken('')
    }

    if (to.path !== '/user/crossroad') {
        next('/user/crossroad')
        return true
    }

    return false
}

/**
 * 检查设备是否准备完毕
 * @param to
 * @returns {boolean}
 */
export const chkQWebBridge = (to) => {
    if (!NEED_EQUIPMENT_PAGE_ARR.includes(to.path)) {
        return true
    }

    if (store.state.equipment.connecting) {
        speakMsg('info', '设备正在连接中，请稍候。', true)
        store.commit('setEquReadyGo', to.path)
        return false
    }

    if (!store.state.equipment.connected) {
        speakMsg('info', '设备将开始连接，请稍候。', true)
        store.commit('setEquReadyGo', to.path)
        store.dispatch('initX')
        return false
    }

    return true
}

/**
 * 向服务器查询机器状态
 * @param to
 * @param next
 * @returns {Promise<boolean>}
 */
export const chkAIO = async (to, next) => {
    if (!NEED_AIO_OK_PAGE_ARR.includes(to.path)) {
        return true
    }

    if (getToken()) {
        equipmentStatus({}).catch(() => {
            speakMsg('info', '本机故障，暂时无法为您提供服务。', true)
            next('/user/crossroad')
        })
        return true
    }

    if (to.path === '/user/login') {
        let r = true
        try {
            await equipmentStatus({})
        } catch {
            r = false
            speakMsg('info', '本机故障，暂时无法为您提供服务。', true)
        }
        return r
    }

    return true
}

/**
 * 前往用户登录页前，检查读卡器
 * @param to
 * @returns {Promise<boolean|any>}
 */
export const chkCardReader = async (to) => {
    if (to.path !== '/user/login') {
        return true
    }

    if (getToken() === USER_LOGIN_STATUS_NAME) {
        return true
    }

    return await store.dispatch('checkCardReader')
}

/**
 * 已登录前往退标页，检查退标器
 * @param to
 * @returns {Promise<boolean|any>}
 */
export const chkCheckin = async (to) => {
    if (to.path !== 'user/back') {
        return true
    }

    if (getToken() !== USER_LOGIN_STATUS_NAME) {
        return true
    }

    return await store.dispatch('checkCheckin')
}

/**
 * 跨角色路由跳转
 * @param to
 * @param from
 */
export const chkCrossRole = (to, from) => {
    const user2admin =
        from.path.startsWith('/user/') && to.path.startsWith('/admin/')
    const admin2user =
        from.path.startsWith('/admin/') && to.path.startsWith('/user/')
    const token = getToken()
    const userLogin = token === USER_LOGIN_STATUS_NAME
    const adminLogin = token === ADMIN_LOGIN_STATUS_NAME

    if (user2admin && userLogin) {
        store.dispatch('userLogout').then(() => {})
    }

    if (admin2user) {
        store.dispatch('doCloseDoor').then(() => {})

        if (adminLogin) {
            store.dispatch('adminLogout').then(() => {})
        }
    }
}

/**
 * 判断是否能前往登录页
 * @param to
 * @returns {boolean}
 */
export const chkGoLogin = (to) => {
    if (!to.path.endsWith('/login')) {
        return true
    }

    const status = getToken()
    if (!status) {
        return true
    }

    // 已登录，若跨角色，需要跳转
    const toAdminLogin = to.path === '/admin/login'
    const isAdminLogin = status === ADMIN_LOGIN_STATUS_NAME
    const toUserLogin = to.path === '/user/login'
    const isUserLogin = status === USER_LOGIN_STATUS_NAME
    return (isAdminLogin && toUserLogin) || (isUserLogin && toAdminLogin)
}

/**
 * 前往需要登录页判断
 * @param to
 * @param next
 * @returns {boolean}
 */
export const chkGoAuth = (to, next) => {
    if (!to.meta.requiresAuth) {
        return true
    }

    const toAdminAuth = to.path.startsWith('/admin/')
    const toUserAuth = to.path.startsWith('/user/')
    const status = getToken()
    if (!status) {
        if (toAdminAuth) {
            next('/admin/login')
        } else if (toUserAuth) {
            store.commit('setFromPath', to.path)
            next('/user/login')
        }
        return false
    }

    const isAdminLogin = status === ADMIN_LOGIN_STATUS_NAME
    const isUserLogin = status === USER_LOGIN_STATUS_NAME
    if (isAdminLogin && toUserAuth) {
        store.commit('setFromPath', to.path)
        next('/user/login')
        return false
    } else if (isUserLogin && toAdminAuth) {
        next('/admin/login')
        return false
    }

    return true
}
