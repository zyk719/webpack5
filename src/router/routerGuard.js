/**
 * config router guard
 * @param router instance of VueRouter
 */
import NProgress from 'nprogress'

import store from '@/store'
import { getToken } from '@/libs/util'
import { USER_LOGIN_STATUS_NAME } from '@/store/bussiness/cardReader'
import { Message } from 'view-design'
import {
    updateVersion,
    resetApp,
    chkQWebBridge,
    chkAIO,
    chkCardReader,
    chkCheckin,
    chkCrossRole,
    chkGoLogin,
    chkGoAuth,
} from '@/router/utils'

function routerGuard(router) {
    router.beforeEach(async (to, from, next) => {
        NProgress.done()

        // scoped helper
        const backUserCrossroad = () => next('/user/crossroad')

        // 应用更新相关操作
        await updateVersion(to, from)

        // 刷新后清除登录状态返回
        if (resetApp(to, from, next)) {
            return
        }

        // QWebBridge 连接检查
        if (!chkQWebBridge(to)) {
            return
        }

        // 机器状态检查
        if (!(await chkAIO(to, next))) {
            return
        }

        // 硬件检查，登录：读卡器
        if (!(await chkCardReader(to))) {
            return
        }

        // 硬件检查，退标：退标器
        if (!(await chkCheckin(to))) {
            return
        }

        // 硬件检查，领标：领标器，取标门（门、门感应器、灯）

        // 跨角色跳转
        chkCrossRole(to, from)

        // 前往登录页
        if (!chkGoLogin(to)) {
            return
        }

        // 前往需要登录页
        if (!chkGoAuth(to, next)) {
            return
        }

        const loginStatus = getToken('token')

        /** 针对性设备检查页 */
        // 1. 领标器 /user/supply todo 本地开发时注释：测领标
        const loginAndToSupply =
            loginStatus === USER_LOGIN_STATUS_NAME && to.path === '/user/supply'
        if (loginAndToSupply) {
            if (!(await store.dispatch('checkCheckout'))) {
                return backUserCrossroad()
            }

            if (store.getters.doorOpened) {
                Message.destroy()
                Message.error('取标门未关闭，请先关闭')
                return backUserCrossroad()
            }
        }

        // 3. 打印机 /user/number
        const loginAndToNum =
            loginStatus === USER_LOGIN_STATUS_NAME && to.path === '/user/number'
        if (loginAndToNum) {
            try {
                await store.dispatch('isPrinterOk')
            } catch (e) {}
        }

        // 返回用户首页，关闭所有灯光
        if (from.path !== null && to.fullPath === '/user/crossroad') {
            store.dispatch('closeAllLights')
        }

        /** 5. 无需捕获条件 */
        NProgress.start()
        next()
    })

    router.afterEach(NProgress.done)
}

export default routerGuard
