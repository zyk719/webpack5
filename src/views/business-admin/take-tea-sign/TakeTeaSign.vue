<template>
    <div class="take-tea-sign">
        <div class="title">茶标取出</div>
        <Form
            label-colon
            ref="form"
            class="form"
            :label-width="199"
            :model="params"
            :rules="rules"
        >
            <Row>
                <Col span="12">
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
                            style="width: 454px;"
                            :value="boxById().mark_typename"
                        />
                    </FormItem>
                </Col>
                <Col span="12">
                    <FormItem label="茶标规格">
                        <AioInput
                            readonly
                            placeholder="选择模块后填充"
                            style="width: 454px;"
                            :value="boxById().specificationsname"
                        />
                    </FormItem>
                </Col>
                <Col span="24">
                    <FormItem label="茶标号段">
                        <AioInput
                            placeholder="请输入"
                            style="width: 454px;"
                            v-model="params.mark_codes[0][0]"
                            @click.native="showIme('num')"
                            @on-blur="hideIme()"
                        />
                        <span class="interval">-</span>
                        <AioInput
                            placeholder="请输入"
                            style="width: 454px;"
                            v-model="params.mark_codes[0][1]"
                            @click.native="showIme('num')"
                            @on-blur="hideIme()"
                        />
                        <span class="count"
                            >共计&nbsp;{{ calcNum }}&nbsp;枚</span
                        >
                        <span class="count-warn">{{ calcWarn }}</span>
                    </FormItem>
                </Col>
                <Col span="24" style="text-align: center;">
                    <AioBtn
                        :disabled="loading || clearLoading"
                        style="margin-top: 60px;"
                        @click="goBackCrossroad"
                        :cancel="true"
                    >
                        返回
                    </AioBtn>
                    <AioBtn
                        :disabled="clearLoading"
                        :loading="loading"
                        style="margin-top: 60px;"
                        @click="handleSave"
                    >
                        取出
                    </AioBtn>
                    <AioBtn
                        :disabled="loading"
                        :loading="clearLoading"
                        style="margin-top: 60px;"
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

import { TAKE_BOX_TYPE } from '@/libs/constant'
import { takeSignCall, clearSignCall } from '@/api/bussiness/admin'

const defaultParams = () => ({
    equipmentbox_id: undefined,
    mark_codes: [['', '']],
})

export default {
    name: 'PutTeaSign',
    components: { AioBtn, AioInput },
    data() {
        return {
            params: defaultParams(),
            rules: {
                equipmentbox_id: {
                    required: true,
                    type: 'number',
                    message: '请选择取出模块',
                    trigger: 'change',
                },
            },
            loading: false,
            clearLoading: false,
        }
    },
    computed: {
        equipmentCode() {
            return this.$store.getters.equipmentCode
        },
        boxInfo() {
            return this.$store.getters.takeBox(TAKE_BOX_TYPE)
        },
        // 3. 计算茶标数量
        calcNum() {
            const [start, end] = this.params.mark_codes[0]
            if (start.length === 0 || end.length === 0) {
                return 0
            }

            if (start.length !== end.length) {
                return 0
            }

            const startNum = Number(start)
            const endNum = Number(end)
            if (isNaN(startNum) || isNaN(endNum)) {
                return 0
            }
            if (endNum < startNum) {
                return 0
            }
            const count = endNum - startNum + 1
            return count
        },
        // 4. 计算提示语
        calcWarn() {
            const [start, end] = this.params.mark_codes[0]
            if (start.length === 0 || end.length === 0) {
                return ''
            }

            if (start.length !== end.length) {
                return ''
            }

            const startNum = Number(start)
            const endNum = Number(end)
            if (isNaN(startNum) || isNaN(endNum)) {
                return ''
            }

            if (endNum < startNum) {
                return '结束号段小于开始号段'
            }

            return ''
        },
    },
    methods: {
        /** 用户事件 */
        // 取出指定号段
        async handleSave() {
            const valid = await this.$refs.form.validate()
            if (!valid) {
                return
            }

            const r = this.calcMarkCode()
            if (!r) {
                return
            }

            // 参数处理
            const params = JSON.parse(JSON.stringify(this.params))
            // [[111, 222], [333, 333]] => ['111-222', '333']
            const markCodesArr = params.mark_codes.map(markCode => {
                // 前后一致时，不用 - 隔开
                if (markCode[0] === markCode[1]) {
                    return markCode[0]
                }
                const r = `${markCode[0]}-${markCode[1]}`
                return r
            })
            params.mark_codes = markCodesArr.join(';')
            try {
                this.loading = true
                const { msg } = await takeSignCall(params)
                this.$Message.success(msg)
                this.resetParams()
            } catch (e) {
                /* do smt */
            } finally {
                this.loading = false
            }
        },

        // 清空号段
        async handleClear() {
            const valid = await this.$refs.form.validate()
            if (!valid) {
                return
            }

            const doClear = async () => {
                // 参数处理
                const params = JSON.parse(JSON.stringify(this.params))
                params.mark_codes = ''
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

            // todo 样式修改
            this.$Modal.confirm({
                title: '确认全部取出',
                content: '您确认要取出全部茶标吗？',
                onOk: doClear,
            })
        },

        /** helpers */
        calcMarkCode() {
            const [start, end] = this.params.mark_codes[0]
            if (start.length === 0 || end.length === 0) {
                this.$Message.warning('号段未输入')
                return false
            }

            if (start.length !== end.length) {
                this.$Message.warning('起始号段与结束号段长度不一致')
                return false
            }

            const startNum = Number(start)
            const endNum = Number(end)
            if (isNaN(startNum) || isNaN(endNum)) {
                return false
            }
            if (endNum < startNum) {
                this.$Message.warning('结束号段小于起始号段')
                return false
            }
            return true
        },
        showIme(type) {
            this.$store.dispatch('showIme', type)
        },
        hideIme() {
            this.$store.dispatch('hideIme')
        },
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
            const box = this.boxInfo.find(box => box.equipmentbox_id === id)
            return box
        },
        // 4. 清除参数
        resetParams() {
            this.params = defaultParams()
            this.$refs.form.resetFields()
        },
        // 5. todo 支持多段号段输入?
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

    // 间隔样式
    .interval {
        padding: 0 30px;
        text-align: center;
        .font(@primary, 32px);
    }

    // 统计样式
    .count {
        display: inline-block;
        padding-left: 30px;
        vertical-align: middle;
        .font(@primary, 32px, 600);
    }
    // 提示语样式
    .count-warn {
        position: absolute;
        left: 0;
        top: 82px;
        padding-left: 30px;
        vertical-align: middle;
        .font(red, 32px, 400);
    }
}
</style>
