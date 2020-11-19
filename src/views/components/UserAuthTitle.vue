<template>
    <div class="user-auth-title">
        <slot>取个标题吧~</slot>
    </div>
</template>

<script>
export default {
    name: 'UserAuthTitle',
}
</script>

<style scoped lang="less">
.user-auth-title {
    padding: 90px 0 60px;
    text-align: center;
    .font(@primary, 56px, bold, 64px, 4px);
}
</style>
