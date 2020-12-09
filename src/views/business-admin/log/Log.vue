<template>
    <div class="admin-log">
        <div class="title-box">
            <AioBtn
                style="margin-right: 199px"
                width="191"
                height="65"
                :cancel="true"
                @click="handleBack"
            >
                <Icon type="ios-undo" />
                返回
            </AioBtn>
            <div class="title">记录查看</div>
            <RadioGroup type="button" v-model="params.business_type">
                <Radio
                    v-for="{ label, value } in curSysDd[ddKeys.type]"
                    :label="value"
                    :key="value"
                >
                    {{ label }}记录
                </Radio>
            </RadioGroup>
        </div>
        <Table stripe :loading="loading" :columns="columns" :data="table" />
        <Page
            show-total
            :page-size="params.rows"
            :current.sync="params.page"
            :total="total"
            :key="pageKey"
        />
    </div>
</template>

<script>
import AioBtn from '@/views/components/AioBtn'

import { boxSignFlowCall } from '@/api/bussiness/admin'

export default {
    name: 'Log',
    components: { AioBtn },
    data() {
        return {
            pageKey: '',
            ddKeys: {
                type: 'Xhlj_Equipment_Trade_BUSINESS_TYPE',
            },
            table: [],
            total: 0,
            loading: false,
            params: {
                business_type: 1,
                rows: 7,
                page: 1,
            },
        }
    },
    computed: {
        curSysDd() {
            return this.$store.getters.curSysDd(this.ddKeys)
        },
        columns() {
            let action = '存入'

            const suitColumns = (action) => {
                const columns = [
                    {
                        title: `${action}日期`,
                        key: 'create_dt',
                        align: 'center',
                        minWidth: 99,
                    },
                    {
                        title: `${action}模块`,
                        key: 'box_code',
                        align: 'center',
                    },
                    {
                        title: '茶标类型',
                        key: 'mark_typename',
                        align: 'center',
                    },
                    {
                        title: '茶标规格',
                        key: 'specificationsname',
                        align: 'center',
                    },
                    {
                        title: `${action}号段`,
                        key: 'mark_codes',
                        align: 'center',
                        minWidth: 99,
                    },
                    {
                        title: `${action}数量（枚）`,
                        key: 'mark_num',
                        align: 'center',
                        minWidth: 99,
                    },
                    {
                        title: '操作人员',
                        key: 'username',
                        align: 'center',
                    },
                ]
                return columns
            }

            const sysDdType = this.curSysDd[this.ddKeys.type]
            if (!sysDdType) {
                return suitColumns(action)
            }

            const r = sysDdType.find(
                (type) => type.value === this.params.business_type
            )

            action = r.label

            return suitColumns(action)
        },
        mac() {
            return this.$store.state.equipment.equipmentBase.mac
        },
    },
    watch: {
        'params.business_type'() {
            if (this.params.page > 1) {
                this.params.page = 1
                return
            }
            this.getLog()
        },
        'params.page'() {
            this.getLog()
        },
        mac() {
            this.getLog()
        },
    },
    mounted() {
        this.init()
    },
    methods: {
        init() {
            this.getSysDd()
            if (this.mac) {
                this.getLog()
            }
        },

        /** 用户事件 */
        handleBack() {
            this.goBackCrossroad()
        },

        goBackCrossroad() {
            this.$router.push('/admin/crossroad')
        },

        /** 接口调用 */
        // 0. 字典表
        getSysDd() {
            Object.values(this.ddKeys).forEach((key) =>
                this.$store.dispatch('suitSysDd', { key })
            )
        },
        // 1. 记录
        async getLog() {
            const params = { ...this.params }
            try {
                this.loading = true
                const { obj, total } = await boxSignFlowCall(params)
                this.table = obj
                this.total = total
            } finally {
                this.loading = false
                this.pageKey = Math.random()
            }
        },
    },
}
</script>

<style scoped lang="less">
@secondary-color: #5eb3d7;

.admin-log {
    padding: 0 40px;

    .title-box {
        height: 164px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title {
            .font(@primary, 56px, bold, normal, 4px);
        }

        /deep/ .ivu-radio-wrapper {
            height: 65px;
            width: 195px;
            box-sizing: border-box;
            text-align: center;
            border: 2px solid @secondary-color;
            border-right: 0;
            .font(@secondary-color, 32px, 400, 61px);

            &:first-child {
                border-radius: 12px 0 0 12px;
            }

            &:last-child {
                border-right: 2px solid @secondary-color;
                border-radius: 0 12px 12px 0;
            }

            &.ivu-radio-wrapper-checked {
                background: @secondary-color;
                color: #fff;
            }
        }
    }

    /deep/ .ivu-table {
        tr > th {
            height: 85px;
            background: #b9dfed;
            .font(@primary, 32px, 600);
        }

        tr > td {
            height: 80px;
            .font(@primary, 28px, 400);
        }
    }
    /deep/ .ivu-table-stripe .ivu-table-body tr:nth-child(2n) td,
    .ivu-table-stripe .ivu-table-fixed-body tr:nth-child(2n) td {
        background-color: #b9dfed;
    }

    // Page
    /deep/ .ivu-page {
        text-align: right;
        margin-top: 20px;

        & > li {
            width: 60px;
            height: 60px;
            font-size: 26px;
            line-height: 60px;

            & > a {
                font-size: inherit;
            }
        }
    }
    /deep/ .ivu-page-total {
        height: 60px;
        font-size: 26px;
        line-height: 60px;
        vertical-align: middle;
    }
}
</style>
