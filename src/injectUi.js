import {
    Button,
    InputNumber,
    Input,
    Table,
    Select,
    Option,
    Radio,
    RadioGroup,
    Message,
    Page,
    Form,
    FormItem,
    Row,
    Col,
    Checkbox,
    Icon,
    Spin,
    Modal,
} from 'view-design'

Message.config({
    top: 108,
    duration: 5,
})

function injectUi(Vue) {
    Vue.component('Button', Button)
    Vue.component('Table', Table)
    Vue.component('InputNumber', InputNumber)
    Vue.component('Input', Input)
    Vue.component('Select', Select)
    Vue.component('Option', Option)
    Vue.component('Radio', Radio)
    Vue.component('Table', Table)
    Vue.component('RadioGroup', RadioGroup)
    Vue.component('Page', Page)
    Vue.component('Form', Form)
    Vue.component('FormItem', FormItem)
    Vue.component('Row', Row)
    Vue.component('Col', Col)
    Vue.component('Checkbox', Checkbox)
    Vue.component('Icon', Icon)
    Vue.component('Spin', Spin)
    Vue.prototype.$Message = Message
    Vue.prototype.$Modal = Modal
}

export default injectUi
