import { setToken } from '@/libs/util'
import router from '@/router'
import store from '@/store'
import { NEED_EQUIPMENT_PAGE_ARR } from '@/router/routerGuard'
import { Message } from 'view-design'

function noQWebBridge() {
    // 0. 将 store equipment connected 改为 false
    store.commit('setConnectStatus', false)

    // 1. 清除登录状态
    setToken('')

    // 2. 返回 /user/crossroad
    // 3. 提示
    const path = router.app.$route.path
    const notAtUserCrossroad = path !== '/user/crossroad'
    const needEquipment = NEED_EQUIPMENT_PAGE_ARR.includes(path)
    if (notAtUserCrossroad && needEquipment) {
        router.push('/user/crossroad').then(() =>
            Message.warning({
                content: '与 QWebBridge 连接断开！',
                duration: 5,
                closable: true,
            })
        )
    } else {
        Message.error({
            content: '无法连接到 QWebBridge ，请确认 QWebBridge 服务已开启！',
            duration: 5,
            closable: true,
        })
    }
}

window.onerror = function(errorMsg) {
    // QWebBridge 未连接或断开
    typeof errorMsg === 'string' &&
        errorMsg.endsWith('opensocket is not defined') &&
        noQWebBridge()
}
