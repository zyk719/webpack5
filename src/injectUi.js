import { Button, Message } from 'view-design'

Message.config({
    top: 108,
    duration: 5,
})

function injectUi(Vue) {
    Vue.component('Button', Button)
    Vue.prototype.$Message = Message
}

export default injectUi
