import { Message, Button, Icon } from 'view-design'

Message.config({
    top: 108,
    duration: 5,
})

function injectUi(Vue) {
    Vue.prototype.$Message = Message
    Vue.component('Button', Button)
    Vue.component('Icon', Icon)
}

export default injectUi
