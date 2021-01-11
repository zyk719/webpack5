<template>
    <div :style="style" class="transition-img">
        <transition name="fade" mode="out-in">
            <img :key="count" :src="src" alt="提示图片" />
        </transition>
    </div>
</template>

<script>
export default {
    name: 'TransitionImg',
    props: {
        width: {
            type: String,
            default: 0,
        },
        height: {
            type: String,
            default: 0,
        },
        img: {
            type: Array,
            default() {
                return []
            },
        },
        interval: {
            type: Number,
            default: 1.5,
        },
    },
    data() {
        return {
            count: 0,
            timerId: -1,
        }
    },
    mounted() {
        this.timerId = setInterval(() => {
            this.count += 1
        }, this.interval * 1000)
    },
    beforeDestroy() {
        clearInterval(this.timerId)
    },
    computed: {
        style() {
            return {
                width: `${this.width}px`,
                height: `${this.height}px`,
            }
        },
        src() {
            return this.img[this.count % this.img.length]
        },
    },
}
</script>

<style scoped lang="less">
.transition-img {
    display: inline-block;
}
</style>
