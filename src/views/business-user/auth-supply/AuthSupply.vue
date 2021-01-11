<template>
    <div style="position: relative">
        <UserAuthTitle style="padding-bottom: 30px; padding-top: 50px"
            >茶标申领</UserAuthTitle
        >
        <div class="content">
            <div v-show="status.fill" style="padding-top: 120px">
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
                        <span class="text"
                            >{{ info.valid_amount / 1000 }}&nbsp;千克</span
                        >
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
            <div
                v-show="status.confirm"
                style="padding-top: 120px; padding-left: 120px"
            >
                <div class="title flex-ac-fs">
                    <span style="font-weight: bold; padding-right: 5px">{{
                        info.grower_name
                    }}</span>
                    <span>先生，茶农编号</span>
                    <span style="font-weight: bold; padding-left: 5px">{{
                        info.grower_code
                    }}</span>
                    <span>，您好，请核对申领信息：</span>
                </div>
                <div class="flex-ac-fs" style="margin-top: 60px">
                    <span class="title">申领量：</span>
                    <span class="boldFont">{{ params.specifications }}克</span>
                    <span class="interval">x</span>
                    <span class="boldFont">{{ params.apply_num }}枚</span>
                    <span class="interval">=</span>
                    <span class="boldFont"
                        >{{
                            params.apply_num * Number(params.specifications)
                        }}克</span
                    >
                </div>
                <div class="flex-ac-fs" style="margin-top: 60px">
                    <span class="title">剩余量：</span>
                    <span class="boldFont"
                        >{{
                            (info.valid_amount -
                                params.apply_num *
                                    Number(params.specifications)) /
                            1000
                        }}千克</span
                    >
                </div>
            </div>
            <div v-show="status.success">
                <div class="flex-center" style="margin-bottom: 40px">
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
                <TransitionImg
                    style="display: block; margin: auto"
                    width="730"
                    height="411"
                    :img="img"
                />
            </div>
            <div v-show="status.failed" style="padding-top: 120px">
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
            <div v-show="status.forbid" style="padding-top: 120px">
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
            <AioBtn :cancel="true" :disabled="loading" @click="handleBack"
                >返回首页</AioBtn
            >
            <!--            <AioBtn v-show="status.fill" @click="$store.dispatch('readQr')"-->
            <!--                >扫码领取</AioBtn-->
            <!--            >-->
            <AioBtn v-show="status.fill" @click="confirm">申领茶标</AioBtn>
            <AioBtn
                v-show="
                    params.specifications && (status.confirm || status.failed)
                "
                @click="backEdit"
                :cancel="true"
                :disabled="loading"
                >返回修改</AioBtn
            >
            <AioBtn
                v-show="status.confirm"
                @click="submitSupply"
                :loading="loading"
                >确认申领</AioBtn
            >
            <!-- 打印凭证 -->
            <AioBtn v-show="status.success && !printed" @click="handlePrint"
                >凭条打印</AioBtn
            >
            <!-- 出标时茶农卡被取走，不能再领取下一笔 -->
            <AioBtn
                v-show="status.success && !takenCardCheckout"
                @click="refill"
                >再领一笔</AioBtn
            >
        </div>

        <!-- 状态查询蒙层 -->
        <Spin fix v-if="$store.state.cache.getOpenStatusLoading">
            <Icon class="demo-spin-icon-load" type="ios-loading" :size="50" />
            <div>领标开放状态查询中...</div>
        </Spin>
    </div>
</template>

<script>
import UserAuthTitle from '@/views/components/UserAuthTitle'
import AioInputNumber from '@/views/components/AioInputNumber'
import AioBtn from '@/views/components/AioBtn'
import TransitionImg from '@/views/components/transitionImg'

import { getBoxCall, putTakeCall } from '@/api/bussiness/user'
import { dateFormat, speakMsg } from '@/libs/treasure'
import { OPEN_DOOR_CACHE_NAME } from '@/config'

import takeSign1 from './takeSign1.png'
import takeSign2 from './takeSign2.png'

const defaultParams = () => ({
    specifications: undefined,
    equ_user_code: '',
    apply_num: 0,
})

export default {
    name: 'AuthSupply',
    components: { UserAuthTitle, AioBtn, AioInputNumber, TransitionImg },
    data() {
        return {
            img: [takeSign1, takeSign2],
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
            apply_code: '',
            taken: false,
            timeStamp: undefined,
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
        // 监听开门|关门
        // 第一次打开门（!this.taken）并在3秒内关门，被认为误操作，会再次打开门
        '$store.getters.doorOpened'(status) {
            if (status && !this.taken) {
                this.timeStamp = new Date().getTime()
                this.taken = true
            }
        },
        '$store.getters.doorClosed'(status) {
            if (status && this.taken && this.timeStamp !== undefined) {
                const now = new Date().getTime()
                const less3second = now - this.timeStamp < 3000
                this.timeStamp = undefined

                if (less3second) {
                    setTimeout(() => {
                        this.$store.dispatch('doOpenDoor')
                    }, 500)
                }
            }
        },
    },
    mounted() {
        this.init()
    },
    beforeDestroy() {
        this.end()
    },
    methods: {
        init() {
            this.getSysDd()
            Object.keys(this.info).length > 0 && this.fillFirstSpecs()
            // 重新查询申领|退标|查询状态
            this.$store.dispatch('getCheckoutCheckinStatus')
        },
        end() {
            this.apply_code = ''
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
            return Math.floor(this.info.valid_amount / Number(specs))
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
            const { grower_name, grower_code, valid_amount } = this.info
            const { specifications, apply_num } = this.params
            const fmt = 'yyyy-MM-dd HH:mm:ss'

            /**
             * 打印参数
             * 1. 打印行为：action = 申领
             * 2. 打印内容：content
             */
            const action = '申领'
            const content =
                '\n*********************************************\n\n' +
                `   茶 农 编 号：${grower_code}\n\n` +
                `   茶 农 姓 名：${grower_name}\n\n` +
                `   申 领 标 量：${specifications}g * ${apply_num}枚\n\n` +
                `   剩 余 标 量：${valid_amount / 1000}kg\n\n` +
                `   申 领 单 号：${this.apply_code}\n\n` +
                `   申 领 时 间：${dateFormat(fmt, new Date())}` +
                '\n\n*********************************************\n'

            const params = { action, content }
            await this.$store.dispatch('doPrint', params)
            speakMsg('success', '打印完成，请取走凭条')
        },
        handleBack() {
            // 用户没有取走本次茶标时不允许返回首页
            if (!this.taken && this.status.success) {
                this.$Message.destroy()
                this.$Message.warning('请先取走本次的茶标')
                return
            }

            // 已取走卡时返回首页，调用登出接口，登出接口自带返回首页逻辑，直接返回
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
            // 1. 领标器状态检查
            if (!(await this.$store.dispatch('checkCheckout'))) {
                return this.$router.push('/user/crossroad')
            }

            // 2. 仓门关闭检查并吸住
            if (this.$store.getters.doorOpened) {
                this.$Message.destroy()
                this.$Message.warning('请先关闭取标门')
                return
            }

            // 3. 按钮禁止点击
            this.$store.commit('setCheckoutLoading', true)

            // 4. 请求可出标盒子信息
            let boxInfo
            try {
                boxInfo = await this.getBoxInfo()
            } catch (e) {
                this.$store.commit('setCheckoutLoading', false)
                this.$Message.warning('发生异常，请点击确认申领按钮重试。')
                return
            }
            const { apply_code, apply_id, equipmentbox_id, box_code } = boxInfo
            this.apply_code = apply_code

            /** **/
            /** 接口完成后，茶农申请的茶标数量已被冻结 **/
            /** **/

            // 5. 调用设备出标 todo 出标卡住无法获取状态
            let checkoutMsg, sign
            try {
                checkoutMsg = this.$Message.loading({
                    content: '正在出标，请稍候...',
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
                // todo 给客户打印异常凭证：单号、申领数量
                this.$Message.error('标号上报异常')
                // 返回首页
                return this.$router.push('/user/crossroad')
            } finally {
                this.$store.commit('setCheckoutLoading', false)
            }

            // 页面切换
            this.statusTransfer('success')

            // 开门
            await this.$store.dispatch('doOpenDoor')

            // 保存当前申领数据到缓存
            const storeOpenParams = () => {
                const params = { equipmentbox_id, apply_id }
                const openDoorParamsArr = JSON.parse(
                    localStorage.getItem(OPEN_DOOR_CACHE_NAME) || '[]'
                )
                openDoorParamsArr.push(params)
                localStorage.setItem(
                    OPEN_DOOR_CACHE_NAME,
                    JSON.stringify(openDoorParamsArr)
                )
            }
            storeOpenParams()

            // 提示取标
            speakMsg(
                'success',
                '您的茶标已完成出标，请打开仓门领取并核对数量。'
            )

            // 更新茶农标量数据
            await this.$store.dispatch(
                'getUserInfo',
                this.$store.state.customer.code
            )
        },
        refill() {
            if (!this.taken) {
                this.$Message.destroy()
                this.$Message.warning('请先取走本次的茶标')
                return
            }

            if (this.$store.getters.doorOpened) {
                this.$Message.destroy()
                this.$Message.warning('请先关闭取标门')
                return
            }

            this.statusTransfer('fill')
            this.params = defaultParams()
            // 填充第一个规格
            this.fillFirstSpecs()
            // 清空凭条打印记录
            this.printed = false
            // 清空领取记录
            this.taken = false
        },

        /** 接口调用 */
        // 0. 字典表
        getSysDd() {
            Object.values(this.ddKeys).forEach((key) =>
                this.$store.dispatch('suitSysDd', { key, needCache: false })
            )
        },
        // 1. 请求出标盒子信息
        async getBoxInfo() {
            const params = { ...this.params }
            params.equ_user_code = this.$store.state.customer.code
            const {
                obj: {
                    apply_code,
                    apply_id,
                    boxInfo: [{ equipmentbox_id, box_code }],
                },
            } = await getBoxCall(params)
            return { apply_code, apply_id, equipmentbox_id, box_code }
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
    width: 1288px;
    height: calc(100% - 279px);
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
.demo-spin-icon-load {
    color: @primary;
    animation: ani-demo-spin 1s linear infinite;

    & + div {
        .font(@primary, 28px, 400);
        margin-top: 10px;
    }
}
</style>
