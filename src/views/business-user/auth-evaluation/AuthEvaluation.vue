<template>
    <div class="evaluation flex-column">
        <TopBar style="flex: 0 0 154px" @onClick="handleBack">订单评价</TopBar>
        <div v-show="!isEvaluation" class="main">
            <div class="cell flex-ac-js" v-for="(item, idx) in list" :key="idx">
                <div class="idx flex-center">
                    {{ (page - 1) * 5 + idx + 1 }}
                </div>
                <div class="text">
                    <div style="line-height: 50px" class="flex-center">
                        <span class="text-overflow" style="width: 36%">
                            订单编号：{{ item['apply_code'] }}
                        </span>
                        <span class="text-overflow" style="width: 64%">
                            收购者：{{ item['enterprise_name'] }}
                        </span>
                    </div>
                    <div style="line-height: 50px" class="flex-center">
                        <span style="width: 36%">
                            交易时间：{{ item['create_dt'] }}
                        </span>
                        <!-- todo 收购量询问 -->
                        <span style="width: 32%">
                            收购量(克)：{{ item['standard_weight'] }}
                        </span>
                        <span style="width: 32%">
                            订单状态：{{ item['statusidname'] }}
                        </span>
                    </div>
                </div>
                <!-- 是否评价：0|未评价 1|已评价 -->
                <AioBtn
                    :style="
                        item.is_pj === 1 ? 'box-shadow: 0 0 0;border: 0;' : ''
                    "
                    :cancel="item.is_pj === 1"
                    width="265"
                    height="75"
                    @click="doEvaluation(item)"
                >
                    {{ item.is_pj === 0 ? '评价' : '已评价' }}
                </AioBtn>
            </div>
            <AioPage
                show-total
                :page-size="5"
                :current.sync="page"
                :total="total"
            />
            <Spin fix v-if="listLoading">
                <Icon
                    class="demo-spin-icon-load"
                    type="ios-loading"
                    :size="50"
                />
                <div>列表加载中...</div>
            </Spin>
        </div>
        <div v-show="isEvaluation" class="cur-evaluation">
            <Form
                style="margin: 0 auto; width: 880px"
                label-colon
                ref="form"
                :label-width="166"
                :model="evaluation"
                :rules="rules"
            >
                <FormItem label="收购者">
                    <div class="content">
                        {{ curEvaluation.enterprise_name }}
                    </div>
                </FormItem>
                <FormItem label="满意度" prop="satisfaction">
                    <RadioGroup
                        :readonly="evaluated"
                        class="radio-group"
                        v-model="evaluation.satisfaction"
                    >
                        <Radio
                            v-for="{ label, value } in curSysDd[
                                ddKeys.satisfaction
                            ]"
                            :key="value"
                            :label="value"
                            :disabled="evaluated"
                        >
                            <div class="content">{{ label }}</div>
                        </Radio>
                    </RadioGroup>
                </FormItem>
                <FormItem label="交易描述">
                    <AioInput
                        :readonly="true"
                        placeholder="请输入交易描述"
                        :value="evaluation.transfer_desc.join(';')"
                    />
                    <div
                        class="flex-ac-fs"
                        style="flex-wrap: wrap"
                        v-show="!evaluated"
                    >
                        <div
                            class="evaluation-text"
                            :class="{
                                disabled: evaluation.transfer_desc.includes(
                                    label
                                ),
                            }"
                            v-for="{ label } in curSysDd[ddKeys.evaluations]"
                            :key="label"
                            @click="
                                evaluation.transfer_desc.includes(label)
                                    ? onBackEvaluation(label)
                                    : onPickEvaluation(label)
                            "
                        >
                            {{ label }}
                        </div>
                    </div>
                </FormItem>
                <FormItem label="问题描述">
                    <AioInput
                        :readonly="evaluated"
                        type="textarea"
                        placeholder="请输入问题描述"
                        v-model="evaluation.proplem_desc"
                        @click.native="evaluated || showIme()"
                        @on-blur="evaluated || hideIme()"
                    />
                </FormItem>
                <div style="text-align: center">
                    <AioBtn
                        :disabled="loading"
                        :cancel="true"
                        @click="onBackList"
                    >
                        返回列表
                    </AioBtn>
                    <AioBtn
                        v-show="!evaluated"
                        :loading="loading"
                        @click="onSubmit"
                    >
                        提交
                    </AioBtn>
                </div>
            </Form>
        </div>
    </div>
</template>

<script>
import TopBar from '@/views/business-user/topBar/TopBar'
import AioBtn from '@/views/components/AioBtn'
import AioInput from '@/views/components/AioInput'
import AioPage from '@/views/components/AioPage'

import { evaluationListCall, evaluationSubmitCall } from '@/api/bussiness/user'
import { ruleSelect } from '@/libs/athena'

const formDefault = () => ({
    apply_id: '',
    equ_user_code: '',
    satisfaction: undefined,
    transfer_desc: [],
    proplem_desc: '',
})

export default {
    name: 'AuthEvaluation',
    components: { TopBar, AioBtn, AioInput, AioPage },
    data() {
        return {
            ddKeys: {
                satisfaction: 'XHLJ_MARK_TRANSFER_SATISFACTION',
                evaluations: 'MARK_TRANSFER_PJ',
            },
            list: [],
            page: 1,
            total: 0,
            isEvaluation: false,
            loading: false,
            listLoading: false,
            curEvaluation: {},
            evaluation: formDefault(),
            rules: {
                satisfaction: ruleSelect('满意度'),
            },
        }
    },
    computed: {
        curSysDd() {
            return this.$store.getters.curSysDd(this.ddKeys)
        },
        code() {
            return this.$store.state.customer.code
        },
        evaluated() {
            return this.curEvaluation.is_pj === 1
        },
    },
    watch: {
        code() {
            this.getSysDd()
            this.getEvaluationList(this.code)
        },
        page() {
            this.getEvaluationList(this.code)
        },
    },
    mounted() {
        if (this.code) {
            this.getSysDd()
            this.getEvaluationList(this.code)
        }
    },
    methods: {
        /** helpers */
        showIme() {
            this.$store.dispatch('showIme', 'zh_hwr')
        },
        hideIme() {
            this.$store.dispatch('hideIme')
        },

        /** 用户事件 */
        handleBack() {
            this.$router.push('/user/crossroad')
        },
        onPickEvaluation(item) {
            this.evaluation.transfer_desc.push(item)
        },
        onBackEvaluation(item) {
            const idx = this.evaluation.transfer_desc.indexOf(item)
            this.evaluation.transfer_desc.splice(idx, 1)
        },
        onBackList() {
            this.isEvaluation = false
            this.curEvaluation = {}
            this.evaluation = formDefault()
        },
        async onSubmit() {
            const valid = await this.$refs.form.validate()
            if (!valid) {
                return
            }

            const params = { ...this.evaluation }
            params.transfer_desc = params.transfer_desc.join(';')
            try {
                this.loading = true
                console.log(params)
                await evaluationSubmitCall(params)
                this.onBackList()
                this.list = []
                await this.getEvaluationList(this.code)
            } finally {
                this.loading = false
            }
        },
        async doEvaluation(evaluation) {
            this.isEvaluation = true
            this.curEvaluation = evaluation

            // 填充评论参数
            this.evaluation.apply_id = evaluation.apply_id
            this.evaluation.equ_user_code = this.code
            this.evaluation.satisfaction = evaluation.satisfaction || undefined
            if (evaluation.transfer_desc === '') {
                this.evaluation.transfer_desc = []
            } else {
                this.evaluation.transfer_desc = evaluation.transfer_desc.split(
                    ';'
                )
            }
            this.evaluation.proplem_desc = evaluation.proplem_desc
        },

        /** 接口调用 */
        // 0. 字典表
        getSysDd() {
            Object.values(this.ddKeys).forEach((key) =>
                this.$store.dispatch('suitSysDd', { key })
            )
        },
        // 1. 划转评价列表
        async getEvaluationList(equ_user_code) {
            const params = {
                equ_user_code,
                page: this.page,
                rows: 5,
            }
            try {
                this.listLoading = true
                const { obj, total } = await evaluationListCall(params)
                this.list = obj
                this.total = total
            } finally {
                this.listLoading = false
            }
        },
    },
}
</script>

<style scoped lang="less">
.evaluation {
    padding: 0 30px 30px;
    height: 100%;

    .main {
        position: relative;
        flex: auto;
        height: 0;
        overflow-y: auto;
        background-color: #d8edf2;
        border-radius: 1px;
        padding: 20px 30px 0;

        .cell {
            height: 126px;
            border-bottom: 1px solid @primary;
            .font(@primary, 28px, 400, 40px);

            .idx {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background-color: #5eb3d7;
                .font(#fff, 28px, 600, 40px);
            }

            .text {
                padding: 15px 0;
                flex: auto;

                span {
                    display: inline-block;
                    padding: 0 0 0 30px;
                }
            }
        }
    }
}

// form
/deep/ .ivu-form-item {
    margin-bottom: 40px;
}
/deep/ .ivu-form-item-label {
    height: 85px;
    .font(@primary, 32px, 600, 65px);

    &::before {
        font-size: inherit;
    }
}
/deep/ .ivu-form-item-error-tip {
    font-size: 28px;
}

.radio-group {
    height: 85px;
    line-height: 85px;

    /deep/ .ivu-radio-inner {
        width: 34px;
        height: 34px;
    }
    /deep/ .ivu-radio-checked .ivu-radio-inner:after {
        width: 28px;
        height: 28px;
        border-radius: 50%;
    }
    /deep/ .ivu-radio-disabled .ivu-radio-inner:after {
        background-color: #2d8cf0;
    }
    /deep/ .ivu-radio-wrapper {
        margin-right: 50px;
    }
}

// 内容
.content {
    height: 85px;
    display: inline-block;
    vertical-align: middle;
    .font(@primary, 32px, 600, 85px);
}

.evaluation-text {
    padding: 6px 30px;
    height: 52px;
    border-radius: 26px;
    background-color: rgba(94, 179, 215, 0.2);
    .font(@primary, 28px, 400, 40px);
    margin: 20px 10px 0;
    cursor: pointer;

    &.disabled {
        background-color: #c5c8ce;
        color: #fff;
    }
}

.demo-spin-icon-load {
    color: @primary;
    animation: ani-demo-spin 1s linear infinite;

    & + div {
        .font(@primary, 28px, 400);
        margin-top: 10px;
    }
}
</style>
