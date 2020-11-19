<template>
    <Page v-bind="$attrs" v-on="$listeners" />
</template>

<script>
export default {
    name: 'AioPage',
    inheritAttrs: false,
}
</script>

<style scoped lang="less">
.ivu-page {
    text-align: right;
    margin-top: 20px;
}

/deep/ li {
    width: 60px;
    height: 60px;
    font-size: 26px;
    line-height: 60px;

    & > a {
        font-size: inherit;
    }
}

/deep/ .ivu-page-total {
    height: 60px;
    font-size: 26px;
    line-height: 60px;
    vertical-align: middle;
}
</style>
