<template>
    <Button
        type="primary"
        v-on="$listeners"
        v-bind="$attrs"
        :style="style"
        :class="`base ${cancel ? 'cancel' : 'submit'}`"
    >
        <slot>取个名字吧~</slot>
    </Button>
</template>

<script>
export default {
    name: 'AioBtn',
    inheritAttrs: false,
    props: {
        cancel: {
            type: Boolean,
            default: false,
        },
        width: {
            type: String,
            default: '400',
        },
        height: {
            type: String,
            default: '85',
        },
    },
    computed: {
        style() {
            return {
                width: `${this.width}px`,
                height: `${this.height}px`,
                lineHeight: `${this.height}px`,
            }
        },
    },
}
</script>

<style scoped lang="less">
@primary-color: #5eb3d7;

.base {
    box-shadow: 0 10px 0 0 #519fbf;
    border-radius: 12px;
    box-sizing: border-box;
    border: 2px solid @primary-color;

    //text-align: center;
    font-size: 32px;
    font-weight: 600;
    letter-spacing: 5px;

    & + .base {
        margin-left: 30px;
    }

    &[disabled] {
        color: #c5c8ce;
        border-color: #c5c8ce;
        box-shadow: 0 10px 0 0 #c0c0c0;
    }
}

.submit {
    background: @primary-color;
    color: #fff;

    &[disabled] {
        color: #fff;
        background: #c5c8ce;
    }
}

.cancel {
    background: #fff;
    color: @primary-color;
}
</style>
