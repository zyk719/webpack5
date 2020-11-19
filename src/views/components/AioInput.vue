<template>
    <Input v-bind="$attrs" v-on="$listeners" />
</template>

<script>
export default {
    name: 'AioInput',
    inheritAttrs: false,
}
</script>

<style scoped lang="less">
/deep/ .ivu-input {
    height: 85px;
    font-size: 32px;
    background: #fff;
    padding: 0 30px;
    border-radius: 12px;
}

/deep/ textarea.ivu-input {
    padding: 15px 30px;
    height: 180px;
}
</style>
