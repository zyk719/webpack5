import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// ui 组件注入
import '@/injectUi'
// 异常捕获开启
import '@/errorCatcher'
// 屏保开启
import '@/bored'

Vue.config.productionTip = false

new Vue({
    router,
    store,
    render: (h) => h(App),
}).$mount('#app')
