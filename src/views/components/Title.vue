<template>
    <div class="inner-title flex-ac-js" @click="moreClickToAdmin">
        <div class="text">西湖龙井茶证明标识发放自助机</div>
        <div class="info flex-ac-js">
            <div
                class="username"
                :style="
                    `opacity: ${isAdminCross || isUserCrossAndLogin ? 1 : 0}`
                "
            >
                欢迎您，{{ info.grower_name || '管理员' }}
            </div>
            <div class="time flex-ac-js">
                <div class="hh-mm">{{ time['HH:mm'] }}</div>
                <div>
                    <div>星期{{ time.week }}</div>
                    <div>{{ time['YYYY/MM/DD'] }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs'

import { CLICK_TO_ADMIN_COUNT } from '@/config'

const weekMapper = {
    0: '日',
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
    6: '六',
}

const YYYY_MM_DD = () => dayjs().format('YYYY/MM/DD')
const HH_mm = () => dayjs().format('HH:mm')
const week = () => dayjs().day()

function refreshTime(time) {
    const now = {
        'YYYY/MM/DD': YYYY_MM_DD(),
        'HH:mm': HH_mm(),
        week: weekMapper[week()],
    }
    Object.assign(time, now)
}

export default {
    name: 'Title',
    data() {
        return {
            time: {
                'YYYY/MM/DD': YYYY_MM_DD(),
                'HH:mm': HH_mm(),
                week: weekMapper[week()],
            },
            haystack: 0,
            timeId: 0,
        }
    },
    computed: {
        info() {
            return this.$store.state.customer.info
        },
        isUserCrossAndLogin() {
            const r = !this.$route.path.endsWith('/user/login')
            const login = !!this.info.grower_name
            return r && login
        },
        isAdminCross() {
            const inAdmin = this.$route.path.startsWith('/admin')
            const r = !this.$route.path.endsWith('/admin/login')
            return inAdmin && r
        },
    },
    watch: {
        haystack(n) {
            if (n >= CLICK_TO_ADMIN_COUNT) {
                this.$router.replace('/admin/login')
                clearTimeout(this.timeId)
                this.haystack = 0
            }
        },
    },
    mounted() {
        setInterval(refreshTime, 1000, this.time)
    },
    methods: {
        moreClickToAdmin() {
            const inAdminPage = this.$route.path.startsWith('/admin')
            if (inAdminPage) {
                return
            }

            this.haystack += 1
            clearTimeout(this.timeId)
            this.timeId = setTimeout(() => {
                this.haystack = 0
            }, 1000 * 10)
        },
    },
}
</script>

<style scoped lang="less">
.inner-title {
    width: 100%;
    height: 110px;
    background: white;
    padding: 0 40px;
    color: @primary;
    box-shadow: 0 4px 0 0 #a3c8de;
    user-select: none;
    cursor: pointer;

    .text {
        font-size: 44px;
        letter-spacing: 2px;
        width: 62.5%;
    }

    .info {
        width: 37.5%;

        .username {
            font-size: 32px;
            font-weight: 600;
        }

        .time {
            font-size: 24px;
            font-weight: 600;
            line-height: 34px;

            .hh-mm {
                font-size: 56px;
                margin-right: 20px;
                letter-spacing: 1px;
            }
        }
    }
}
</style>
