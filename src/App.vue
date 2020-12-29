<template>
    <div id="app" :style="`transform: scale(${scale.x}, ${scale.y});`">
        <router-view />
    </div>
</template>

<script>
import store from '@/store'
import { OPEN_DOOR_CACHE_NAME } from '@/config'
import { uploadUserOpenDoor } from '@/api/bussiness/user'

function suitScale(scale) {
    const newScale = {
        x: (window.innerWidth / 1920).toFixed(20),
        y: (window.innerHeight / 1080).toFixed(20),
    }
    Object.assign(scale, newScale)
}

export default {
    name: 'App',
    data() {
        return {
            scale: {
                x: 1,
                y: 1,
            },
        }
    },
    created() {
        suitScale(this.scale)
    },
    mounted() {
        this.startEquipment()
        window.onresize = suitScale.bind(this, this.scale)
    },
    watch: {
        // 检测到 门 & 门感应器 & 门磁铁开关 都已打开时，打开门和感应的事件通道
        '$store.getters.doorFriendsOk'(status) {
            status && this.$store.dispatch('doorReady')
            // status && this.$store.dispatch('doOpenDoor')
        },
        // 检测到门被关上，吸住
        '$store.getters.doorClosed'(status) {
            status && this.$store.dispatch('doCloseDoor')
        },
        // 检测到门被打开
        '$store.getters.doorOpened'(status) {
            if (status) {
                this.uploadOpen()
            }
        },
    },
    methods: {
        startEquipment() {
            this.$store.dispatch('initX')
        },
        uploadOpen() {
            const paramsArr = JSON.parse(
                localStorage.getItem(OPEN_DOOR_CACHE_NAME) || '[]'
            )

            paramsArr.forEach((params) => {
                params.equ_user_code = this.$store.state.customer.code
                uploadUserOpenDoor(params)
            })

            localStorage.setItem(OPEN_DOOR_CACHE_NAME, '[]')
        },
    },
}
</script>

<style lang="less">
@import '~normalize.css';
@import '~nprogress/nprogress.css';
@import './main.less';

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

// ui size
#app {
    width: 1920px;
    height: 1080px;
    transform-origin: top left;
}
</style>
