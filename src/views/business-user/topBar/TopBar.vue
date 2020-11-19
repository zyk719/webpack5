<template>
    <div class="title-box flex-ac-js">
        <AioBtn width="191" height="65" :cancel="true" @click="handleClick">
            <Icon type="ios-undo" />
            返回
        </AioBtn>
        <div class="title">
            <slot></slot>
        </div>
        <div style="width: 191px;opacity: 0;" />
    </div>
</template>

<script>
import AioBtn from '@/views/components/AioBtn'

export default {
    name: 'TopBar',
    components: { AioBtn },
    methods: {
        handleClick() {
            this.$emit('onClick')
        },
    },
}
</script>

<style scoped lang="less">
.title-box {
    height: 174px;

    .title {
        .font(@primary, 56px, bold, 64px, 4px);
    }
}
</style>
