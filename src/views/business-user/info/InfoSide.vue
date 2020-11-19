<template>
    <div class="inner-switch scroll-bar">
        <AioBtn
            height="110"
            class="info-side"
            v-for="s in curSysDd[ddKeys.list]"
            :key="s.value"
            :cancel="s.value !== value"
            @click="handleToggle(s.value)"
        >
            {{ s.label }}
        </AioBtn>
    </div>
</template>

<script>
import AioBtn from '@/views/components/AioBtn'

export default {
    name: 'InfoSide',
    components: { AioBtn },
    data() {
        return {
            ddKeys: {
                list: 'EQUIPMENT_CATEGORYS',
            },
        }
    },
    props: {
        value: {
            type: String,
            default: '',
        },
    },
    computed: {
        curSysDd() {
            return this.$store.getters.curSysDd(this.ddKeys)
        },
    },
    activated() {
        this.init()
    },
    // 离开时复位到首个
    deactivated() {
        const list = this.curSysDd[this.ddKeys.list]
        if (list) {
            this.$emit('input', list[0].value)
        }
    },
    watch: {
        curSysDd(nV) {
            const list = nV[this.ddKeys.list]
            if (list) {
                this.$emit('input', list[0].value)
            }
        },
    },
    methods: {
        init() {
            this.getSysDd()
            const list = this.curSysDd[this.ddKeys.list]
            if (list) {
                this.$emit('input', list[0].value)
            }
        },

        handleToggle(value) {
            if (this.curSwitch === value) {
                return
            }
            this.$emit('input', value)
        },

        /** 接口调用 */
        // 0. 字典表
        getSysDd() {
            Object.values(this.ddKeys).forEach(key =>
                this.$store.dispatch('suitSysDd', key)
            )
        },
    },
}
</script>

<style scoped lang="less">
.inner-switch {
    flex: 0 0 360px;
    overflow-y: auto;
}

.info-side {
    margin-left: 0 !important;
    border-radius: 18px !important;
    width: 100% !important;
    flex-shrink: 0;

    & + .info-side {
        margin-top: 37px;
    }
}
</style>
