<template>
    <div>
        <UserAuthTitle>茶标申领</UserAuthTitle>
        <div class="content">
            <div v-show="status.fill">
                <div class="flex-ac-js">
                    <div class="flex-ac-js">
                        <span class="title">姓名：</span>
                        <span class="text">{{ info.grower_name }}</span>
                    </div>
                    <div class="flex-ac-js">
                        <span class="title">茶农编号：</span>
                        <span class="text">{{ info.grower_code }}</span>
                    </div>
                    <div class="flex-ac-js">
                        <span class="title">可申领量：</span>
                        <span class="text">
                            {{ info.valid_amount / 1000 }}&nbsp;千克
                        </span>
                    </div>
                </div>
                <div class="flex-ac-fs" style="margin-top: 80px">
                    <div class="flex-ac-js">
                        <span class="title">申领：</span>
                    </div>
                    <div class="flex-ac-js">
                        <Select v-model="params.specifications">
                            <Option
                                v-for="specs in Object.keys(
                                    info.specifications || {}
                                )"
                                :key="specs"
                                :value="specs"
                            >
                                {{ specs }}g
                            </Option>
                        </Select>
                        <span class="interval">x</span>
                        <Form :model="params" ref="form">
                            <FormItem
                                style="margin-bottom: 0"
                                prop="apply_num"
                                :rules="signNumberRule"
                            >
                                <AioInputNumber
                                    :precision="0"
                                    :min="0"
                                    :max="buildMax()"
                                    v-model="params.apply_num"
                                    @click.native="showIme"
                                    @on-blur="hideIme"
                                />
                            </FormItem>
                        </Form>
                        <span class="interval">
                            枚 （剩余
                            {{
                                params.specifications
                                    ? buildMax() - params.apply_num
                                    : '-'
                            }}
                            枚）
                        </span>
                    </div>
                </div>
            </div>
            <div v-show="status.confirm">
                <div class="title flex-ac-fs">
                    <span style="font-weight: bold; padding-right: 5px">
                        {{ info.grower_name }}
                    </span>
                    先生，茶农编号
                    <span style="font-weight: bold; padding-left: 5px">
                        {{ info.grower_code }}
                    </span>
                    ，您好，请核对申领信息：
                </div>
                <div class="flex-ac-fs" style="margin-top: 60px">
                    <span class="title">申领量：</span>
                    <span class="boldFont">{{ params.specifications }}克</span>
                    <span class="interval">x</span>
                    <span class="boldFont">{{ params.apply_num }}枚</span>
                    <span class="interval">=</span>
                    <span class="boldFont">
                        {{ params.apply_num * Number(params.specifications) }}克
                    </span>
                </div>
                <div class="flex-ac-fs" style="margin-top: 40px">
                    <span class="title">剩余量：</span>
                    <span class="boldFont">
                        {{
                            (info.valid_amount -
                                params.apply_num *
                                    Number(params.specifications)) /
                            1000
                        }}千克
                    </span>
                </div>
            </div>
            <div v-show="status.success">
                <div class="flex-center">
                    <img
                        width="170"
                        height="170"
                        src="./happy.svg"
                        alt="icon"
                    />
                    <div style="height: 170px; margin-left: 60px">
                        <div class="title" style="line-height: 85px">
                            您已成功申领:
                            <span class="boldFont">
                                {{ params.specifications }}克
                            </span>
                            <span class="interval">x</span>
                            <span class="boldFont">
                                {{ params.apply_num }}枚
                            </span>
                            <span class="interval">=</span>
                            <span class="boldFont">
                                {{
                                    params.apply_num *
                                    Number(params.specifications)
                                }}克
                            </span>
                            茶标
                        </div>
                        <div class="title" style="line-height: 85px">
                            当前账户剩余:
                            <span class="boldFont">
                                {{ info.valid_amount / 1000 }}千克
                            </span>
                            茶标
                        </div>
                    </div>
                </div>
            </div>
            <div v-show="status.failed" style="margin-top: 60px">
                <div class="flex-center">
                    <img width="170" height="170" src="./sad.svg" alt="icon" />
                    <div style="height: 170px; margin-left: 60px">
                        <div class="title" style="line-height: 85px">
                            很抱歉，本机器茶标不足。
                        </div>
                        <div class="title" style="line-height: 85px">
                            请您使用其他站点机器。
                        </div>
                    </div>
                </div>
            </div>
            <div v-show="status.forbid">
                <div class="flex-center">
                    <img width="170" height="170" src="./sad.svg" alt="icon" />
                    <div style="height: 170px; margin-left: 60px">
                        <div class="title" style="line-height: 170px">
                            未开放申领！
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div style="text-align: center">
            <AioBtn :cancel="true" :disabled="loading" @click="handleBack">
                返回首页
            </AioBtn>
            <AioBtn v-show="status.fill" @click="confirm">申领茶标</AioBtn>
            <AioBtn
                v-show="
                    params.specifications && (status.confirm || status.failed)
                "
                @click="backEdit"
                :cancel="true"
                :disabled="loading"
            >
                返回修改
            </AioBtn>
            <AioBtn
                v-show="status.confirm"
                @click="submitSupply"
                :loading="loading"
            >
                确认申领
            </AioBtn>
            <!-- 打印凭证 -->
            <AioBtn v-show="status.success && !printed" @click="handlePrint">
                凭条打印
            </AioBtn>
            <!-- 出标时茶农卡被取走，不能再领取下一笔 -->
            <AioBtn
                v-show="status.success && !takenCardCheckout"
                @click="refill"
            >
                再领一笔
            </AioBtn>
        </div>
    </div>
</template>

<script>
import UserAuthTitle from '@/views/components/UserAuthTitle'
import AioInputNumber from '@/views/components/AioInputNumber'
import AioBtn from '@/views/components/AioBtn'

import { getBoxCall, putTakeCall } from '@/api/bussiness/user'
import { log, speakMsg } from '@/libs/treasure'
import store from '@/store'

const defaultParams = () => ({
    specifications: undefined,
    equ_user_code: '',
    apply_num: 0,
})

export default {
    name: 'AuthSupply',
    components: { UserAuthTitle, AioBtn, AioInputNumber },
    data() {
        return {
            ddKeys: {
                growerMax: 'XHLJ_MARK_EQUIPMENT_GROWER_NUM',
                enterpriseMax: 'XHLJ_MARK_EQUIPMENT_ENTERPRISE_NUM',
            },
            status: {
                fill: true,
                confirm: false,
                success: false,
                failed: false,
                forbid: false,
            },
            params: defaultParams(),
            signNumberRule: [
                {
                    validator: (rule, value, callback) => {
                        if (!this.params.specifications) {
                            callback(new Error('请先选择申领规格'))
                        }

                        const growerMax = this.curSysDd[
                            this.ddKeys.growerMax
                        ][0].value
                        if (this.params.apply_num > growerMax) {
                            callback(new Error(`最多领取 ${growerMax} 枚`))
                        }

                        callback()
                    },
                },
                {
                    type: 'number',
                    min: 1,
                    required: true,
                    message: '请输入茶标申领量',
                    trigger: 'change',
                },
            ],
            printed: false,
        }
    },
    computed: {
        info() {
            return this.$store.state.customer.info
        },
        curSysDd() {
            return this.$store.getters.curSysDd(this.ddKeys)
        },
        loading() {
            return this.$store.state.customer.checkoutLoading
        },
        takenCardCheckout() {
            return this.$store.state.customer.takenCardCheckout
        },
    },
    watch: {
        'params.specifications'() {
            this.$refs.form.resetFields()
        },
        info(nv) {
            Object.keys(nv).length > 0 && this.fillFirstSpecs()
        },
        // 监听是否可申领
        '$store.state.cache.isOpen.is_can_apply_grower': {
            handler(nv) {
                console.log('in watch', nv)
                const forbid = nv === '2'
                if (forbid) {
                    this.statusTransfer('forbid')
                }
                const canSupply = nv === '1'
                if (canSupply) {
                    this.statusTransfer('fill')
                }
            },
            immediate: true,
        },
    },
    mounted() {
        this.init()
    },
    methods: {
        init() {
            this.getSysDd()
            Object.keys(this.info).length > 0 && this.fillFirstSpecs()
            // 重新查询茶农申领退状态
            this.$store.dispatch('getCheckoutCheckinStatus')
        },

        /** helpers */
        // 填充第一个规格
        fillFirstSpecs() {
            const specs = Object.keys(this.info.specifications || {})
            if (specs.length) {
                this.params.specifications = specs[0]
            } else {
                // 没有可领的茶标，直接到 failed 页面
                this.statusTransfer('failed')
            }
        },
        // 可申领的最大值
        buildMax() {
            const specs = this.params.specifications
            if (!specs) {
                return 0
            }

            // 最大可申领量 / 规格，向下取整
            const realMax = Math.floor(this.info.valid_amount / Number(specs))
            return realMax
        },
        // 输入法打开
        showIme() {
            this.$store.dispatch('showIme', 'num_s')
        },
        // 输入法关闭
        hideIme() {
            this.$store.dispatch('hideIme')
        },

        /** 用户事件 */
        async handlePrint() {
            this.printed = true
            const { specifications, apply_num } = this.params
            // 数量、时间、订单号、标题
            const res = await this.$store.dispatch('doPrint', {
                title: '领标凭条',
                time: '2020/11/25',
                content: `
                    规格：${specifications}
                    标量：${apply_num}
                    总量：${apply_num * Number(specifications)}克
                `,
            })
            speakMsg('success', `${res}，请取走凭条`)
        },
        handleBack() {
            if (this.takenCardCheckout) {
                this.$store.dispatch('takeIcCardCb')
                return
            }
            this.$router.push('/user/crossroad')
        },

        /** 流程控制 */
        // 控制状态流
        statusTransfer(target) {
            Object.keys(this.status).forEach(
                (key) => (this.status[key] = false)
            )
            this.status[target] = true
        },
        async confirm() {
            // 校验输入值合法
            const valid = await this.$refs.form.validate()
            if (!valid) {
                return
            }
            // 判断机器剩余茶标数
            const equipmentMax = this.info.specifications[
                this.params.specifications
            ]
            if (this.params.apply_num > equipmentMax) {
                this.statusTransfer('failed')
                return
            }
            this.statusTransfer('confirm')
        },
        backEdit() {
            this.statusTransfer('fill')
        },
        async submitSupply() {
            /** 1. 领标器状态检查 */
            try {
                await store.dispatch('isCheckoutOk')
            } catch (e) {
                this.$Message.error('领标器异常')
                return this.$router.push('/user/crossroad')
            }

            /** 2. todo 仓门关闭检查并吸住 */

            /** 3. 打开屏幕禁止 */
            this.$store.commit('setCheckoutLoading', true)

            /** 4. 请求可出标盒子信息 */
            let boxInfo
            try {
                boxInfo = await this.getBoxInfo()
            } catch (e) {
                // 请求出标盒子时发生异常：
                // 0. 关闭屏幕禁止
                // 1. 提示客户重试
                this.$store.commit('setCheckoutLoading', false)
                this.$Message.warning(
                    '请求出标信息时发生异常，可点击确认申领按钮重试。'
                )
                return
            }
            const { apply_id, equipmentbox_id, box_code } = boxInfo

            /** 接口完成后，茶农申请的茶标量已被冻结 */

            /** 5. 调用设备出标 */
            let checkoutMsg, sign
            try {
                checkoutMsg = this.$Message.loading({
                    content: '正在出标，结束前请勿打开仓门！',
                    duration: 0,
                })
                sign = await this.$store.dispatch('readImage', {
                    box: box_code,
                    total: this.params.apply_num,
                })
            } catch (e) {
                // todo 会发生出了部分标后机器报异常的情况吗？
                // todo 手动告诉服务器机器故障了，上报模块状态

                // todo 给客户打印异常凭证：单号、申领数量
                this.$Message.error('领标器异常')
                // 返回首页
                return this.$router.push('/user/crossroad')
            } finally {
                checkoutMsg()
            }

            /** 将机器的出标标号提交给服务器 todo 导去异常页 */
            try {
                await this.putSign(apply_id, equipmentbox_id, sign)
            } catch (e) {
                // 接口报异常即机器故障
                // todo 机器门被强拉开标被取走

                // todo 给客户打印异常凭证：单号、申领数量
                this.$Message.error('标号上报异常')
                // 返回首页
                return this.$router.push('/user/crossroad')
            } finally {
                this.$store.commit('setCheckoutLoading', false)
            }

            /** 提示取标 */
            speakMsg(
                'success',
                '您的茶标已完成出标，请打开仓门领取并核对数量。'
            )

            /** todo 开门 */

            /** 7秒后语音提示关闭仓门 */
            setTimeout(() => {
                speakMsg('info', '茶标领取完成后请关闭仓门')
            }, 1000 * 7)

            /** 更新茶农标量数据 */
            await this.$store.dispatch(
                'getUserInfo',
                this.$store.state.customer.code
            )

            /** 页面切换 */
            this.statusTransfer('success')
        },
        refill() {
            this.statusTransfer('fill')
            // 清空已填写数据
            this.params = defaultParams()
            // 填充第一个规格
            this.fillFirstSpecs()
            // 清空凭条打印记录
            this.printed = false
        },

        /** 接口调用 */
        // 0. 字典表
        getSysDd() {
            Object.values(this.ddKeys).forEach((key) =>
                this.$store.dispatch('suitSysDd', key)
            )
        },
        // 1. 请求出标盒子信息
        async getBoxInfo() {
            const params = { ...this.params }
            params.equ_user_code = this.$store.state.customer.code
            const {
                obj: {
                    apply_id,
                    boxInfo: [{ equipmentbox_id, box_code }],
                },
            } = await getBoxCall(params)
            return { apply_id, equipmentbox_id, box_code }
        },
        // 2. 提交出标信息
        async putSign(apply_id, equipmentbox_id, sign) {
            const mark_codes = sign.join(';')
            const params = {
                apply_id,
                equ_user_code: this.$store.state.customer.code,
                detail_json: [{ equipmentbox_id, mark_codes }],
            }
            await putTakeCall(params)
        },
    },
}
</script>

<style scoped lang="less">
.content {
    width: 1177px;
    height: calc(100% - 399px);
    padding-top: 60px;
    margin: 0 auto;

    .title {
        font-size: 36px;
        font-weight: 400;
        color: @primary;
    }

    .text {
        font-size: 48px;
        font-weight: 600;
        color: @primary;
    }

    .boldFont {
        font-size: 36px;
        font-weight: 600;
        color: @primary;
    }

    .interval {
        margin: 0 20px;
        text-align: center;
        font-size: 36px;
        font-weight: 400;
        color: @primary;
    }

    // select
    /deep/ .ivu-select {
        width: 200px;
        height: 85px;
        position: relative;
    }
    /deep/ .ivu-select-single .ivu-select-selection {
        height: 85px;
        background: #fff;
        border-radius: 12px;
    }
    /deep/ .ivu-select-placeholder,
    /deep/ .ivu-select-selected-value {
        height: 85px;
        line-height: 85px;
        font-size: 32px;
        padding-left: 30px;
        font-weight: 400;
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
    /deep/ .ivu-select-not-found > li {
        height: 71px;
        font-size: 32px !important;
        line-height: 71px;
    }

    /deep/ .ivu-form-item-error-tip {
        font-size: 28px;
    }
}
</style>
