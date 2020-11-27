/**
 * config router guard
 * @param router instance of VueRouter
 */
import NProgress from 'nprogress'
import Axios from 'axios'

import store from '@/store'
import { getToken, setToken } from '@/libs/util'
import { log } from '@/libs/treasure'
import { USER_LOGIN_STATUS_NAME } from '@/store/bussiness/cardReader'
import { ADMIN_LOGIN_STATUS_NAME } from '@/api/app/user'
import { Message } from 'view-design'
import { equipmentStatus } from '@/api/bussiness/user'

const VERSION_CACHE_NAME = 'aioVersion'

// 需机器准备好的网页
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
    '/admin/log',
]

// 需要无故障的网页
const NEED_EQUIPMENT_OK_PAGE_ARR = [
    '/user/login',
    '/user/supply',
    '/user/number',
    '/user/back',
    '/user/sign',
    '/user/supply_pack',
    '/user/evaluation',
    '/admin/put_tea_sign',
    '/admin/take_tea_sign',
]

async function getVersion() {
    const { data } = await Axios.get('./version.json', {
        headers: {
            'Cache-Control': 'no-cache',
        },
    })
    return data
}

function routerGuard(router) {
    // log('router is', router.options)

    router.beforeEach(async (to, from, next) => {
        log(from.path, to.path)
        NProgress.done()
        // equipmentStatus({}).then(res => log(res))

        /** 0. 刷新页面：对应业务逻辑 */
        /** 1. 前往登录页前（已登录无法触发?）：请求版本信息，比对后刷新页面 */
        /** 2. 多角色页面跳转：退出当前登录，前往对应登录页 */
        /** 3. 未登录前往需要登录页：跳转登录页 */
        /** 4. 已登录前往登录页：留在当前页 */
        /** 5. 可能有未捕获条件，开发环境弹出 */

        const loginStatus = getToken('token')

        /** 0. 刷新页面 */
        const isReload = from.name === null
        if (isReload) {
            // 当前版本号保存
            getVersion().then(({ version }) =>
                localStorage.setItem(VERSION_CACHE_NAME, version)
            )

            // 连接 QWebBridge => 初始化设备控制器 => 获取 MAC 地址
            // 若管理员已登录 && 获取设备和设备盒子信息
            store.dispatch('initX')

            // 在用户页 && 当前页需要登录 => 退出登录 => 返回首页
            // 用户无法刷新，此操作仅在测试时生效
            if (loginStatus === USER_LOGIN_STATUS_NAME) {
                setToken('')

                if (to.meta.requiresAuth) {
                    return next('/user/crossroad')
                }
            }

            // todo 在用户登录页刷新时，需等读卡器就位后才能读卡

            return next()
        }

        /** 1. 前往无需登录页且未登录：请求版本信息，不同则刷新页面 */
        const needCompareVersion = !to.meta.requiresAuth && !loginStatus
        if (needCompareVersion) {
            getVersion().then(
                ({ version }) =>
                    localStorage.getItem(VERSION_CACHE_NAME) !== version &&
                    setTimeout(
                        window.location.reload.bind(window.location),
                        2000
                    )
            )
        }

        /** 2. 连接到设备后才能访问页：需 QWebBridge 已连接 */
        const QWebBridgeConnected = store.state.equipment.connected
        const needEquipmentPage = NEED_EQUIPMENT_PAGE_ARR.includes(to.path)
        if (!QWebBridgeConnected && needEquipmentPage) {
            Message.warning({
                content: '前往页面需要连接 QWebBridge 后才能访问！',
                closable: true,
                duration: 5,
            })
            return next(from.path)
        }

        /** 2. 设备无故障才能访问的页面 */
        const needEquipmentOkPage = NEED_EQUIPMENT_OK_PAGE_ARR.includes(to.path)
        if (needEquipmentOkPage) {
            if (loginStatus) {
                // 已登录异步调用
                equipmentStatus({}).catch(() => {
                    Message.warning({
                        content: '自助机异常，当前无法使用！',
                        closable: true,
                    })
                    next('/user/crossroad')
                })
            } else if (to.path === '/user/login') {
                // 未登录前往登录页时同步调用
                // 0. 读卡器状态查询
                // todo 本地开发时注释
                try {
                    await store.dispatch('isCardReaderOk')
                } catch (e) {
                    Message.warning('读卡器异常，本机暂时无法为您提供服务。')
                    return next('/user/crossroad')
                }
                // 1. 设备异常查询
                try {
                    await equipmentStatus({})
                } catch (e) {
                    Message.warning({
                        content: '自助机异常，当前页无法使用！',
                        closable: true,
                    })
                    return next('/user/crossroad')
                }
            }
        }

        /** 2. 跨角色路由跳转 */
        // user => admin
        const isFromUserToAdmin =
            from.path.startsWith('/user') && to.path.startsWith('/admin')
        const isUserLogin = loginStatus === USER_LOGIN_STATUS_NAME
        if (isFromUserToAdmin) {
            isUserLogin &&
                store.dispatch('userLogout').then(() => log('用户已退出'))
            NProgress.start()
            return next()
        }
        // admin => user
        const isFromAdminToUser =
            from.path.startsWith('/admin') && to.path.startsWith('/user')
        const isAdminLogin = loginStatus === ADMIN_LOGIN_STATUS_NAME
        if (isFromAdminToUser) {
            isAdminLogin &&
                store.dispatch('adminLogout').then(() => log('管理员已退出'))
            NProgress.start()
            return next()
        }

        /** 3. 未登录前往需要登录页：跳转登录页 */
        if (!loginStatus) {
            let target
            // 多角色系统需要判断
            to.meta.requiresAuth &&
                (target = to.path.startsWith('/admin')
                    ? '/admin/login'
                    : '/user/login')
            // 登录页前往要登录页(浏览器回退情况)会被重定向回来，不打开 NProgress
            !from.path.endsWith('/login') && NProgress.start()
            // 保存跳转页
            if (target === '/user/login') {
                store.commit('setFromPath', to.path)
            }
            return next(target)
        }

        /** 4. 已登录前往登录页：留在当前页 */
        const isToAdminLogin = isAdminLogin && to.path === '/admin/login'
        const isToUserLogin = isUserLogin && to.path === '/user/login'
        if (isToAdminLogin || isToUserLogin) {
            return next(from.path)
        }

        /** 针对性设备检查页 */
        // 1. 领标器 /user/supply todo 本地开发时注释：测领标
        const loginAndToSupply =
            loginStatus === USER_LOGIN_STATUS_NAME && to.path === '/user/supply'
        if (loginAndToSupply) {
            try {
                await store.dispatch('isCheckoutOk')
            } catch (e) {
                Message.error('领标器异常')
                return next('/user/crossroad')
            }
        }
        // 2. 退标器 /user/back todo 本地开发时注释：测退标
        const loginAndToBack =
            loginStatus === USER_LOGIN_STATUS_NAME && to.path === '/user/back'
        if (loginAndToBack) {
            try {
                await store.dispatch('isCheckinOk')
            } catch (e) {
                Message.error('退标器异常')
                return next('/user/crossroad')
            }
        }

        /** 5. 无需捕获条件 */
        NProgress.start()
        next()
    })

    router.afterEach(NProgress.done)
}

export default routerGuard
