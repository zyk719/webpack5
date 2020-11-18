<template>
    <div class="hello">
        HelloWorld
        <div>{{ hello }}</div>
        <div>{{ world }}</div>
        <Button type="primary">HXHX</Button>
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
        console.log(process.env.BASE_URL, '123')
    },
}
</script>

<style scoped lang="less">
.hello {
    color: red;
}
</style>
