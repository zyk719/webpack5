<template>
    <div class="take-tea-sign">
        <div class="title">退标取出</div>
        <Form
            label-colon
            ref="form"
            class="form"
            :label-width="199"
            :model="params"
            :rules="rules"
        >
            <Row>
                <Col span="24">
                    <FormItem label="设备编号">
                        <div class="content">{{ equipmentCode }}</div>
                    </FormItem>
                </Col>
                <Col span="12">
                    <FormItem label="取出模块" prop="equipmentbox_id">
                        <Select v-model="params.equipmentbox_id">
                            <Option
                                v-for="{ equipmentbox_id } in boxInfo"
                                :key="equipmentbox_id"
                                :value="equipmentbox_id"
                            >
                                {{ equipmentbox_id }}
                            </Option>
                        </Select>
                    </FormItem>
                </Col>
                <Col span="12">
                    <FormItem label="茶标类型">
                        <AioInput
                            readonly
                            placeholder="选择模块后填充"
                            style="width: 454px"
                            :value="boxById().mark_typename"
                        />
                    </FormItem>
                </Col>
                <Col span="24" style="text-align: center; margin-top: 125px">
                    <AioBtn
                        :disabled="clearLoading"
                        style="margin-top: 60px"
                        @click="goBackCrossroad"
                        :cancel="true"
                    >
                        返回
                    </AioBtn>
                    <AioBtn
                        :loading="clearLoading"
                        style="margin-top: 60px"
                        @click="handleClear"
                    >
                        全部取出
                    </AioBtn>
                </Col>
            </Row>
        </Form>
    </div>
</template>

<script>
import AioBtn from '@/views/components/AioBtn'
import AioInput from '@/views/components/AioInput'

import { BACK_BOX_TYPE } from '@/libs/constant'
import { clearSignCall } from '@/api/bussiness/admin'

export default {
    name: 'TakeTeaSignBack',
    components: { AioBtn, AioInput },
    data() {
        return {
            params: {
                equipmentbox_id: undefined,
                isRefund: 1,
            },
            rules: {
                equipmentbox_id: {
                    required: true,
                    type: 'number',
                    message: '请选择取出模块',
                    trigger: 'change',
                },
            },
            clearLoading: false,
        }
    },
    computed: {
        equipmentCode() {
            return this.$store.getters.equipmentCode
        },
        boxInfo() {
            return this.$store.getters.takeBox(BACK_BOX_TYPE)
        },
    },
    methods: {
        /** 用户事件 */
        // 清空号段
        async handleClear() {
            const valid = await this.$refs.form.validate()
            if (!valid) {
                return
            }

            const doClear = async () => {
                // 参数处理
                const params = { ...this.params }
                try {
                    this.clearLoading = true
                    const { msg } = await clearSignCall(params)
                    this.$Message.success(msg)
                    this.resetParams()
                } catch (e) {
                    /* do smt */
                } finally {
                    this.clearLoading = false
                }
            }

            this.$Modal.confirm({
                title: '确认取出全部退标',
                content: '您确认要取出全部退标吗？',
                onOk: doClear,
            })
        },

        /** helpers */
        // 1. 返回首页
        goBackCrossroad() {
            this.$router.push('/admin/crossroad')
        },
        // 2. 根据盒子 id 获取：茶标类型和茶标规格
        boxById() {
            const id = this.params.equipmentbox_id
            if (id === undefined) {
                return {
                    mark_typename: '',
                    specificationsname: '',
                }
            }
            const box = this.boxInfo.find((box) => box.equipmentbox_id === id)
            return box
        },
        // 4. 清除参数
        resetParams() {
            this.params.equipmentbox_id = undefined
            this.$refs.form.resetFields()
        },
    },
}
</script>

<style scoped lang="less">
.take-tea-sign {
    padding-top: 90px;

    .title {
        text-align: center;
        .font(@primary, 56px, bold, 64px, 4px);
    }

    .form {
        width: 1400px;
        margin: 70px auto 0;

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

        // select
        /deep/ .ivu-select {
            width: 454px;
            height: 85px;
        }
        /deep/ .ivu-select-single .ivu-select-selection {
            height: 85px;
            background: #fff;
            border-radius: 12px;
        }
        /deep/ .ivu-select-placeholder,
        /deep/ .ivu-select-selected-value {
            height: 85px;
            padding-left: 30px;
            .font(#c5c8ce, 32px, 400, 85px);
        }
        /deep/ .ivu-select-selected-value {
            color: @primary;
        }
        /deep/ .ivu-select-arrow {
            font-size: 32px;
            right: 30px;
        }
        /deep/ .ivu-select-item {
            height: 85px;
            font-size: 32px !important;
            line-height: 71px;
        }
    }

    // 内容
    .content {
        height: 85px;
        .font(@primary, 32px, 600, 85px);
    }
}
</style>
