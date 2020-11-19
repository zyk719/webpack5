import { log } from '@/libs/treasure'

const ime = {
    state: {},
    getters: {},
    mutations: {
        setIme(state, ime) {
            state.ime = ime
        },
    },
    actions: {
        // type: 'en' 'zh_py' 'zh_hwr' 'symb' 'num' 'num_s'
        showIme({ state }, type) {
            state.ime.showInputAtCursorPos(type)
        },
        hideIme({ state }) {
            state.ime.close()
        },
    },
}

export default ime
