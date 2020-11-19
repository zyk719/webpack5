import Vue from 'vue'
import VueRouter from 'vue-router'
import routerGuard from '@/router/routerGuard'

// components
import Layout from '@/views/Layout'

Vue.use(VueRouter)

/**
 * issue: push route then guard redirect => Redirected when going from "/xxx" to "/yyy" via a navigation guard.
 */
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location, onResolve, onReject) {
    if (onResolve || onReject) {
        return originalPush.call(this, location, onResolve, onReject)
    }
    return originalPush.call(this, location).catch(err => err)
}

const routes = [
    {
        path: '/',
        redirect: '/user/crossroad',
    },
    {
        path: '/layout',
        name: 'Layout',
        component: Layout,
        children: [
            /** admin routes */
            {
                path: '/admin/login',
                name: 'AdminLogin',
                component: () =>
                    import(
                        /* webpackChunkName: "adminLogin" */ '@/views/business-admin/login/AdminLogin'
                    ),
            },
            {
                path: '/admin/crossroad',
                name: 'AdminCrossroad',
                component: () =>
                    import(
                        /* webpackChunkName: "adminCrossroad" */ '@/views/business-admin/crossroad/Crossroad'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
            {
                path: '/admin/put_tea_sign',
                name: 'PutTeaSign',
                component: () =>
                    import(
                        /* webpackChunkName: "putTeaSign" */ '@/views/business-admin/put-tea-sign/PutTeaSign'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
            {
                path: '/admin/take_tea_sign',
                name: 'TakeTeaSign',
                component: () =>
                    import(
                        /* webpackChunkName: "takeTeaSign" */ '@/views/business-admin/take-tea-sign/TakeTeaSign'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
            {
                path: '/admin/log',
                name: 'Log',
                component: () =>
                    import(
                        /* webpackChunkName: "log" */ '@/views/business-admin/log/Log'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
            /** user routes */
            {
                path: '/user/login',
                name: 'UserLogin',
                component: () =>
                    import(
                        /* webpackChunkName: "userLogin" */ '@/views/business-user/login/UserLogin'
                    ),
            },
            {
                path: '/user/info',
                name: 'Info',
                component: () =>
                    import(
                        /* webpackChunkName: "info" */ '@/views/business-user/info/Info'
                    ),
            },
            {
                path: '/user/issue',
                name: 'Issue',
                component: () =>
                    import(
                        /* webpackChunkName: "issue" */ '@/views/business-user/issue/Issue'
                    ),
            },
            {
                path: '/user/video',
                name: 'Video',
                component: () =>
                    import(
                        /* webpackChunkName: "video" */ '@/views/business-user/video/Video'
                    ),
            },
            {
                path: '/user/loss',
                name: 'Loss',
                component: () =>
                    import(
                        /* webpackChunkName: "loss" */ '@/views/business-user/loss/Loss'
                    ),
            },
            {
                path: '/user/crossroad',
                name: 'Crossroad',
                component: () =>
                    import(
                        /* webpackChunkName: "crossroad" */ '@/views/business-user/crossroad/Crossroad'
                    ),
            },
            {
                path: '/user/supply',
                name: 'AuthSupply',
                component: () =>
                    import(
                        /* webpackChunkName: "authSupply" */ '@/views/business-user/auth-supply/AuthSupply'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
            {
                path: '/user/number',
                name: 'AuthNumber',
                component: () =>
                    import(
                        /* webpackChunkName: "authNumber" */ '@/views/business-user/auth-number/AuthNumber'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
            {
                path: '/user/back',
                name: 'AuthBack',
                component: () =>
                    import(
                        /* webpackChunkName: "authBack" */ '@/views/business-user/auth-back/AuthBack'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
            {
                path: '/user/sign',
                name: 'AuthSign',
                component: () =>
                    import(
                        /* webpackChunkName: "authSign" */ '@/views/business-user/auth-sign/AuthSign'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
            {
                path: '/user/supply_pack',
                name: 'AuthSupplyPack',
                component: () =>
                    import(
                        /* webpackChunkName: "authSupplyPack" */ '@/views/business-user/auth-supply-pack/AuthSupplyPack'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
            {
                path: '/user/evaluation',
                name: 'AuthEvaluation',
                component: () =>
                    import(
                        /* webpackChunkName: "authEvaluation" */ '@/views/business-user/auth-evaluation/AuthEvaluation'
                    ),
                meta: {
                    requiresAuth: true,
                },
            },
        ],
    },
]

const router = new VueRouter({ routes })

routerGuard(router)

export default router
