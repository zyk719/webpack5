<template>
    <div class="inner-title flex-ac-js" @click="moreClickToAdmin">
        <div class="text">西湖龙井茶证明标识发放自助机</div>
        <div class="info flex-ac-js">
            <div
                class="username"
                :style="`opacity: ${
                    isAdminCross || isUserCrossAndLogin ? 1 : 0
                }`"
            >
                欢迎您，{{ info.grower_name || '管理员' }}
            </div>
            <div class="time flex-ac-js">
                <div class="hh-mm">{{ time['HH:mm'] }}</div>
                <div>
                    <div>星期{{ time.week }}</div>
                    <div>{{ time['YYYY/MM/DD'] }}</div>
                </div>
                <!-- 天气 -->
                <div class="weather flex-center" v-show="showWeather">
                    <img :src="weatherImg" alt="w" />
                    <div style="margin-left: 5px; font-size: 36px">
                        {{ tem }}℃
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs'

import { CLICK_TO_ADMIN_COUNT } from '@/config'
import axios from 'axios'

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
            // 天气
            showWeather: false,
            weatherImg: '',
            tem: '',
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
        this.getWeather()
        setInterval(this.getWeather, 1000 * 60 * 60 * 3)

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
        async getWeather() {
            try {
                const url = `https://www.tianqiapi.com/api?version=v6&appid=79894615&appsecret=PpZjK6iF`
                const {
                    data: { tem, wea_img },
                } = await axios.get(url)
                this.tem = tem
                this.weatherImg = `https://www.mingtai18.com/tianqiapi/skin/pitaya/${wea_img}.png`
                this.showWeather = true
            } catch (e) {
                this.showWeather = false
            }
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
        width: 58%;
    }

    .info {
        width: 42%;

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

            .weather {
                text-align: center;
                margin-left: 20px;
            }
        }
    }
}
</style>
