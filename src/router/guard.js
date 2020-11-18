/**
 * config router guard
 * @param router instance of VueRouter
 */
import NProgress from 'nprogress'

function guard(router) {
    router.beforeEach()

    router.afterEach(NProgress.done)
}

export default guard
