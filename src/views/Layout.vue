<template>
    <div class="layout flex-column">
        <Title class="title" />
        <div class="content">
            <keep-alive :include="include">
                <router-view class="route" />
            </keep-alive>
        </div>
        <ScreenSaver />
    </div>
</template>

<script>
// components
import Title from '@/views/components/Title'
// import ScreenSaver from '@/components/ScreenSaver'
const ScreenSaver = () =>
    import(/* webpackChunkName: "screenSaver" */ '@/components/ScreenSaver')

export default {
    name: 'Layout',
    components: { Title, ScreenSaver },
    data() {
        return {
            include: ['Crossroad', 'Video', 'Info'],
        }
    },
}
</script>

<style scoped lang="less">
.layout {
    height: inherit;

    .title {
        z-index: 1;
    }

    .content {
        background: #d8edf2;
        height: calc(100% - 110px);
        padding: 20px;

        .route {
            width: 100%;
            height: 100%;
            background: #f6fcfc;
        }
    }
}
</style>
