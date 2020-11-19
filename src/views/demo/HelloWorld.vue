<template>
    <div class="hello">
        HelloWorld
        <div>{{ hello }}</div>
        <div>{{ world }}</div>
        <img src="./demo.png" alt="demo" />
        <Button type="primary">HXHX</Button>
        <Icon type="ios-checkmark"></Icon>
    </div>
</template>

<script>
export default {
    name: 'HelloWorld',
    data() {
        return {
            hello: 'value my',
            world: 'world my',
        }
    },
    mounted() {
        console.log(process.env.VUE_APP_BASEURL, '123')
    },
}
</script>

<style scoped lang="less">
.hello {
    color: @primary;
}
</style>
