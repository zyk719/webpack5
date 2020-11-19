<template>
    <Select transfer v-bind="$attrs" v-on="$listeners">
        <Option v-for="{ label, value } in option" :key="value">
            {{ label }}
        </Option>
    </Select>
</template>

<script>
export default {
    name: 'AioSelect',
    inheritAttrs: false,
    props: {
        option: {
            type: Array,
            default: () => [],
        },
    },
}
</script>

<style scoped lang="less"></style>
