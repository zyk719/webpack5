import store from '@/store'
import {
    hasSignCall,
    userCurrentNumberCall,
    isOpenCall,
} from '@/api/bussiness/user'
import { getFileList } from '@/api/app/sys'

const cache = {
    state: {
        userCurrentNumber: {},
        imgUrl: '',
        isSign: false,
        isOpen: {
            // 茶农申领开放 1 是 | 2 否
            is_can_apply_grower: '2',
            // 茶农退标开发 1 是 | 2 否
            is_can_refund_grower: '2',
        },
    },
    getters: {},
    mutations: {
        setUserCurrentNumber(state, number) {
            state.userCurrentNumber = number
        },
        setSignImgUrl(state, imgUrl) {
            state.imgUrl = imgUrl
        },
        setIsSign(state, isSign) {
            state.isSign = isSign
        },
        setIsOpen(state, isOpen) {
            state.isOpen = isOpen
        },
        resetCache(state) {
            state.userCurrentNumber = {}
            state.imgUrl = ''
            state.isSign = false
            state.isOpen = {
                checkin: false,
                checkout: false,
            }
        },
    },
    actions: {
        async getUserCurrentNumber({ commit }) {
            const equ_user_code = store.state.customer.code
            if (!equ_user_code) {
                return
            }

            const params = { equ_user_code }
            const { obj } = await userCurrentNumberCall(params)
            commit('setUserCurrentNumber', obj)
        },
        async getSignStatus({ commit }) {
            const equ_user_code = store.state.customer.code
            if (!equ_user_code) {
                return
            }

            const params = { equ_user_code }
            const {
                // 是否已签订 1|是 2|否
                obj: { is_sign, sign_img },
            } = await hasSignCall(params)

            const isSign = is_sign === 1
            commit('setIsSign', isSign)

            if (isSign) {
                const params = {
                    fid: sign_img,
                }
                const {
                    obj: [{ filepath }],
                } = await getFileList(params)
                const imgUrl = process.env['VUE_APP_BASEURL'] + '/' + filepath
                commit('setSignImgUrl', imgUrl)
            } else {
                commit('setSignImgUrl', '')
            }
        },
        async getCheckoutCheckinStatus({ commit }) {
            const equ_user_code = store.state.customer.code
            if (!equ_user_code) {
                return
            }

            const params = { equ_user_code }
            const { obj } = await isOpenCall(params)
            commit('setIsOpen', obj)
        },
    },
}

export default cache
