<template>
    <InputNumber v-bind="$attrs" v-on="$listeners" />
</template>

<script>
export default {
    name: 'AioInputNumber',
}
</script>

<style scoped lang="less">
// input number
.ivu-input-number {
    width: 399px;
    height: 85px;
    border-radius: 12px;
}
/deep/ .ivu-input-number-input-wrap {
    height: 85px;
    padding: 0 30px;
    .font(@primary, 32px, 400, 85px);

    .ivu-input-number-input {
        height: 85px;
        line-height: 85px;
    }
}
/deep/ .ivu-input-number-handler-wrap {
    width: 0;
}
</style>
