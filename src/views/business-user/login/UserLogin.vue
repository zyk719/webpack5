<template>
    <div class="user-login">
        <div class="login">
            <div class="tip">
                请将身份证或茶农卡放在识别区&nbsp;<span v-show="time > 0">
                    {{ time }}&nbsp;秒
                </span>
            </div>
            <img src="./for-login.svg" alt="icon" />
        </div>
        <Sidebar class="sidebar" />
    </div>
</template>

<script>
import Sidebar from '@/views/business-user/sidebar/Sidebar'
import { isDev } from '@/libs/treasure'
import { TIMEOUT } from '@/store/bussiness/common'

export default {
    name: 'UserLogin',
    components: { Sidebar },
    data() {
        return {
            time: TIMEOUT.INSERT / 1000,
        }
    },
    computed: {
        idc() {
            return this.$store.state.customer.controller
        },
    },
    watch: {
        idc() {
            this.readyForReading()
        },
    },
    mounted() {
        this.init()
    },
    beforeDestroy() {
        this.end()
    },
    methods: {
        init() {
            this.readyForReading()
            // todo 本地开发时打开：无设备开发
            // this.devAutoLogin()
        },
        end() {
            clearInterval(this.timeId)
        },

        readyForReading() {
            // 登录页刷新时，需判断 IDC 控制器已初始化
            // 判断依据：初始 IDC 为 empty object，判空确定是否完成
            if (Object.keys(this.idc).length === 0) {
                return
            }

            // 倒计时
            this.timeId = setInterval(() => {
                ;(this.time -= 1) === 0 && clearInterval(this.timeId)
            }, 1010)

            // 准备读卡
            this.$store.dispatch('forInsert')
        },

        // 本地开发，无读卡器情况下登录
        devAutoLogin() {
            if (!isDev) {
                return
            }
            setTimeout(() => {
                this.$store.dispatch('userLogin', '0000001231603163970430')
            }, 500)
        },
    },
}
</script>

<style scoped lang="less">
.user-login {
    padding: 95px 90px 0;
    display: flex;

    .login {
        flex: auto;

        // child layout
        padding-top: 182px;
        text-align: center;

        .tip {
            margin-bottom: 100px;
            .font(@primary, 56px, normal, 64px, 4px);
        }
    }
}

.demo-spin-icon-load {
    color: @primary;
    animation: ani-demo-spin 1s linear infinite;

    & + div {
        .font(@primary, 28px, 400);
        margin-top: 10px;
    }
}
</style>
