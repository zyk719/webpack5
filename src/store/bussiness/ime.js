import { log } from '@/libs/treasure'

const ime = {
    state: {
        controller: {},
    },
    getters: {},
    mutations: {
        setImeControllerSubscriber(state, controller) {
            state.controller = controller
        },
    },
    actions: {
        // type: 'en' 'zh_py' 'zh_hwr' 'symb' 'num' 'num_s'
        showIme({ state }, type) {
            state.controller.showInputAtCursorPos(type)
        },
        hideIme({ state }) {
            state.controller.close()
        },
    },
}

export default ime
