<template>
    <div>
        <video src="/demo.mp4"></video>
    </div>
</template>

<script>
export default {
    name: 'YiVideo',
    data() {
        return {
            key: '',
        }
    },
    props: {
        propName: {
            type: Number,
            default: 0,
        },
    },
    methods: {
        // todo 播放
        // todo 暂停
        // todo 快进，快退
        //
    },
}
</script>

<style scoped lang="less"></style>
