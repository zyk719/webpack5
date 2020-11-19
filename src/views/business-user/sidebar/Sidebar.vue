<template>
    <div class="inner-sidebar">
        <!--
        <router-link tag="div" to="/" class="route-btn">
            <img class="icon" src="./mobile.svg" alt="icon" />
            远程联系
        </router-link>
        -->
        <router-link tag="div" to="/user/loss" class="route-btn">
            <img class="icon" src="./loss.svg" alt="icon" width="48" />
            茶农卡挂失
        </router-link>
        <router-link tag="div" to="/user/info" class="route-btn">
            <img class="icon" src="./info.svg" alt="icon" />
            公共信息
        </router-link>
        <router-link tag="div" to="/user/video" class="route-btn">
            <img class="icon" src="./video.svg" alt="icon" />
            宣传视频
        </router-link>
        <router-link tag="div" to="/user/issue" class="route-btn">
            <img class="icon" src="./issue.svg" alt="icon" />
            常见问题
        </router-link>
    </div>
</template>

<script>
export default {
    name: 'Sidebar',
}
</script>

<style scoped lang="less">
.inner-sidebar {
    .route-btn {
        // box style
        width: 380px;
        height: 120px;
        background: #d8eef2;
        border-radius: 18px;
        cursor: pointer;
        margin-left: 80px;

        & + .route-btn {
            margin-top: 35px;
        }

        .font(@primary, 36px, 600, nomarl, 2px);

        // child layout
        padding-left: 65px;
        display: flex;
        align-items: center;
        justify-content: flex-start;

        .icon {
            margin-right: 24px;
            width: 40px;
        }
    }
}
</style>
