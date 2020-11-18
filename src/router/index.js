import Vue from 'vue'
import VueRouter from 'vue-router'
import guard from '@/router/guard'

Vue.use(VueRouter)

/**
 * fix issue: push route then guard redirect => Redirected when going from "/xxx" to "/yyy" via a navigation guard.
 */
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location, onResolve, onReject) {
    if (onResolve || onReject) {
        return originalPush.call(this, location, onResolve, onReject)
    }
    return originalPush.call(this, location).catch((err) => err)
}

const routes = [
    {
        path: '/',
        component: () =>
            import(/* webpackChunkName: "demo" */ '@/views/demo/HelloWorld'),
    },
]

const router = new VueRouter({ routes })

guard(router)

export default router
