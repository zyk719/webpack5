<template>
    <div style="position: relative">
        <UserAuthTitle style="padding-bottom: 30px; padding-top: 50px"
            >茶标退还{{ status.warn ? '须知' : '' }}</UserAuthTitle
        >
        <div class="content" :style="status.success ? 'width: 1800px;' : ''">
            <!-- 退标提示 -->
            <div v-show="status.warn" style="padding-top: 120px">
                <div class="flex-center">
                    <img
                        width="170"
                        height="170"
                        src="./surprised.svg"
                        alt="icon"
                    />
                    <div style="height: 170px; margin-left: 60px">
                        <div class="title" style="line-height: 85px">
                            1、请保证茶标完整性(无折角，无损坏，未刮开)
                        </div>
                        <div class="title" style="line-height: 85px">
                            2、请将茶标正面朝上放入退标口且退标过程中请勿拉拽茶标
                        </div>
                        <div class="title" style="line-height: 85px">
                            3、退标成功后，茶标电子量将会退回至所属茶农账户中
                        </div>
                    </div>
                </div>
            </div>
            <!-- 服务端返回无可退标盒子时提示 -->
            <div v-show="status.failed" style="padding-top: 120px">
                <div class="flex-center">
                    <img
                        width="170"
                        height="170"
                        src="./surprised.svg"
                        alt="icon"
                    />
                    <div style="height: 170px; margin-left: 60px">
                        <div class="title" style="line-height: 85px">
                            很抱歉，本机器暂时无法退标。
                        </div>
                        <div class="title" style="line-height: 85px">
                            请您使用其他站点机器。
                        </div>
                    </div>
                </div>
            </div>
            <!-- 用户点击启动退标 -->
            <div v-show="status.back" style="padding-top: 120px">
                <div class="title flex-center">
                    <span style="font-weight: bold; padding-right: 5px">{{
                        info.grower_name
                    }}</span
                    >先生，茶农编号<span
                        style="font-weight: bold; padding-left: 5px"
                        >{{ info.grower_code }}</span
                    >，请点击开始退标后，将茶标放入退标口：
                </div>
            </div>
            <!-- 用户完成退标操作 -->
            <div v-show="status.submit" style="padding-top: 30px">
                <div class="title flex-center" style="margin-bottom: 40px">
                    已接收您的退标数量为：<span
                        style="
                            font-weight: bold;
                            font-size: 60px;
                            margin-right: 10px;
                        "
                        >{{ $store.state.returnBox.count }}</span
                    >&nbsp;枚
                </div>
                <TransitionImg
                    style="display: block; margin: auto"
                    width="730"
                    height="411"
                    :img="img"
                />
            </div>
            <!-- 退标信息展示 -->
            <div v-show="status.success" style="padding-top: 10px">
                <div class="title flex-ac-fs" style="margin-bottom: 40px">
                    <span class="boldFont">{{ info.grower_name }}</span>
                    <span>&nbsp;先生，茶农编号&nbsp;</span>
                    <span class="boldFont">{{ info.grower_code }}</span>
                    <span>，您已成功退标&nbsp;</span>
                    <span class="boldFont">{{ returnNum }}</span>
                    <span>&nbsp;枚，&nbsp;您账户剩余&nbsp;</span>
                    <span class="boldFont"
                        >{{ info.valid_amount / 1000 }}千克</span
                    >
                    <span>&nbsp;茶标</span>
                </div>
                <div class="back-detail">
                    <div class="back-success" v-if="backSuccess.length">
                        <div class="detail-title flex-center">退标详情</div>
                        <div class="detail-cnt">
                            <div
                                class="detail-success-cell"
                                v-for="{
                                    apply_code,
                                    grower_code,
                                    grower_name,
                                    return_num,
                                } in backSuccess"
                                :key="apply_code"
                            >
                                <div>
                                    <span class="w600">退标单号：</span>
                                    <span>{{ apply_code }}&nbsp;</span>
                                </div>
                                <div>
                                    <span class="w600">茶农：</span>
                                    <span>{{ grower_name }}&nbsp;</span>
                                    <span class="w600">编号：</span>
                                    <span>{{ grower_code }}&nbsp;</span>
                                    <span class="w600">退标数量：</span>
                                    <span>{{ return_num }} * 250g</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="back-fail" v-if="backFail.length">
                        <div class="detail-title flex-center">
                            异常标详情（{{ backFail.length }}枚）
                        </div>
                        <div class="detail-cnt scroll-bar">
                            <div
                                class="detail-fail-cell"
                                v-for="{ mark_code, errorMsg } in backFail"
                                :key="mark_code"
                            >
                                <span style="padding-right: 60px">{{
                                    mark_code
                                }}</span>
                                <span>{{ errorMsg }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 服务端返回无可退标盒子时提示 -->
            <div v-show="status.forbid" style="padding-top: 120px">
                <div class="flex-center">
                    <img width="170" height="170" src="./sad.svg" alt="icon" />
                    <div style="height: 170px; margin-left: 60px">
                        <div class="title" style="line-height: 170px">
                            未开放退标！
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div style="text-align: center">
            <AioBtn
                v-show="!(status.submit && count > 0)"
                :disabled="loading"
                :cancel="true"
                @click="handleBack"
                >返回首页</AioBtn
            >
            <AioBtn v-show="status.warn" @click="statusTransfer('back')"
                >我已知晓</AioBtn
            >
            <AioBtn v-show="status.back" :loading="loading" @click="startBack"
                >开始退标</AioBtn
            >
            <!-- todo 用户忘记点完成退标，需自动提交：用户取走茶农卡时，如果在退标页且未提交 -->
            <AioBtn
                v-show="status.submit && $store.state.returnBox.barcode.length"
                :loading="loading"
                @click="doSubmit"
                >完成退标</AioBtn
            >
            <AioBtn
                v-show="!printed && status.success"
                @click="handlePrint(backSuccess, backFail)"
                >凭条打印</AioBtn
            >
            <AioBtn
                v-show="
                    status.success && !$store.state.customer.takenCardCheckin
                "
                @click="reBack"
                >再退一笔</AioBtn
            >
        </div>

        <!-- 状态查询蒙层 -->
        <Spin fix v-if="$store.state.cache.getOpenStatusLoading">
            <Icon class="demo-spin-icon-load" type="ios-loading" :size="50" />
            <div>退标开放状态查询中...</div>
        </Spin>
    </div>
</template>

<script>
import UserAuthTitle from '@/views/components/UserAuthTitle'
import AioBtn from '@/views/components/AioBtn'
import TransitionImg from '@/views/components/transitionImg'

import { putBackBoxCall, submitBackCall } from '@/api/bussiness/user'
import { dateFormat, speakMsg } from '@/libs/treasure'

import backSign1 from '@/views/business-user/auth-back/backSign1.png'
import backSign2 from '@/views/business-user/auth-back/backSign2.png'

export default {
    name: 'AuthBack',
    components: { UserAuthTitle, AioBtn, TransitionImg },
    data() {
        return {
            img: [backSign1, backSign2],
            status: {
                warn: true,
                back: false,
                submit: false,
                success: false,
                failed: false,
                forbid: false,
            },
            params: {
                equ_user_code: '',
            },
            loading: false,
            returnNum: 0,
            checkinBoxInfo: {},
            printed: false,
            backSuccess: [
                // {
                //     apply_code: 'ZZTB2021010610301853060',
                //     grower_code: '100651',
                //     grower_name: '朱旭东',
                //     return_num: '5',
                // },
            ],
            backFail: [
                // {
                //     mark_code: '90017654',
                //     errorMsg: '该证明标已退标，无法进行退标',
                // },
            ],
        }
    },
    computed: {
        info() {
            return this.$store.state.customer.info
        },
        count() {
            return this.$store.state.returnBox.count
        },
    },
    watch: {
        // 监听是否可退标
        '$store.state.cache.isOpen.is_can_refund_grower': {
            handler(nv) {
                console.log('in watch', nv)
                const forbid = nv === '2'
                if (forbid) {
                    this.statusTransfer('forbid')
                }
                const canSupply = nv === '1'
                if (canSupply) {
                    this.statusTransfer('warn')
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
            // 检查是否有退标盒子
            this.readWarn()
            // 重新查询申领|退标|查询状态
            this.$store.dispatch('getCheckoutCheckinStatus')
        },

        /** helpers */

        /** 用户事件 */
        async handlePrint(success, error) {
            this.printed = true

            // 退标成功
            const backDetail = success.length
                ? success.reduce((acc, v, idx) => {
                      acc +=
                          `     退标单号：${v.apply_code}\n\n` +
                          `     茶农编号：${v.grower_code}    茶农姓名：${v.grower_name}\n\n` +
                          `     退标数量：250g * ${v['return_num']}枚\n\n`
                      if (idx < success.length - 1) {
                          acc +=
                              '---------------------------------------------\n\n'
                      }

                      return acc
                  }, `   退 标 明 细：\n\n`)
                : ''

            // 退标失败
            let errorDetail = error.length
                ? error.slice(0, 10).reduce((acc, v) => {
                      acc += `     ${v['mark_code']} ${v['errorMsg']}\n\n`
                      return acc
                  }, `   异 常 明 细（${error.length}枚）：\n\n`)
                : ''

            if (error.length > 10) {
                errorDetail += `     ......\n\n`
            }

            const { grower_name, grower_code } = this.info
            const fmt = 'yyyy-MM-dd HH:mm:ss'
            const action = '退标'
            const content =
                '\n*********************************************\n\n' +
                `   茶 农 编 号：${grower_code}\n\n` +
                `   茶 农 姓 名：${grower_name}\n\n` +
                `   退 标 时 间：${dateFormat(fmt, new Date())}\n\n` +
                backDetail +
                errorDetail +
                '*********************************************\n'

            const params = { action, content }
            const res = await this.$store.dispatch('doPrint', params)
            speakMsg('success', `打印完成，请取走凭条`)
        },
        handleBack() {
            // 退标过程中卡被取走
            if (this.$store.state.customer.takenCardCheckin) {
                this.$store.dispatch('userLogout')
            }
            this.$store.dispatch('doneCheckin')
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
        async readWarn() {
            const params = {
                equ_user_code: this.$store.state.customer.code,
            }
            const { obj } = await putBackBoxCall(params)
            const noCheckinBox = obj.length === 0
            if (noCheckinBox) {
                this.statusTransfer('failed')
                return
            }
            // 退标盒只有一个
            this.checkinBoxInfo = obj[0]
        },
        async startBack() {
            try {
                await this.$store.dispatch('doCheckin')
                this.$store.commit('setCheckinLoading', true)
            } catch (e) {
                return
            }
            this.statusTransfer('submit')
        },
        async doSubmit() {
            // 关闭退标器
            this.$store.dispatch('doneCheckin')

            // todo 查询是否正在退标中

            // 提交数据
            this.loading = true
            try {
                const equ_user_code = this.$store.state.customer.code
                const mark_codes = this.$store.state.returnBox.barcode.join(';')
                const equipmentbox_id = this.checkinBoxInfo.equipmentbox_id
                const params = {
                    equ_user_code,
                    detail_json: [
                        {
                            mark_codes,
                            equipmentbox_id,
                            specifications: '250',
                        },
                    ],
                }
                const {
                    obj: { growerInfoList, errorList },
                } = await submitBackCall(params)
                this.$store.commit('setCheckinLoading', false)

                console.log('obj', growerInfoList, errorList)

                // 展示服务器对所退茶标的校验信息
                // 数量
                this.returnNum = growerInfoList
                    .map((info) => info.return_num)
                    .reduce((acc, v) => acc + v, 0)
                this.backSuccess = growerInfoList
                this.backFail = errorList

                // 清空已提交的数据
                this.$store.commit('setCount', 0)
                this.$store.commit('clearBarcode')

                // 更新用户信息
                this.$store.dispatch('getUserInfo', equ_user_code)

                this.statusTransfer('success')
            } catch (e) {
                // todo 保证要提交成功！！！
            } finally {
                this.loading = false
            }
        },
        reBack() {
            // 清空凭条打印记录
            this.printed = false
            this.statusTransfer('back')
        },
    },
}
</script>

<style scoped lang="less">
.content {
    width: 1288px;
    height: calc(100% - 279px);
    margin: 0 auto;

    .w600 {
        font-weight: 600;
    }

    .title {
        .font(@primary, 36px, 400);
    }

    .text {
        .font(@primary, 48px, 600);
    }

    .boldFont {
        .font(@primary, 36px, 600);
    }

    .error-sn {
        display: inline-block;
        margin-left: 99px;
        vertical-align: middle;
        .font(@primary, 28px);
    }

    .success-sn {
        .font(@primary, 28px);
    }

    .back-detail {
        display: flex;
        height: 464px;

        .back-success {
            background: #d8edf2;
            flex-basis: 50%;
            flex-grow: 1;
            margin-right: 20px;
            padding: 0 40px 43px;
        }

        .back-fail {
            background: #d8edf2;
            flex-basis: 50%;
            flex-grow: 1;
            padding: 0 40px 43px;
        }

        @interval-color: rgba(57, 104, 134, 0.3);

        .detail-title {
            .font(@primary, 32px);
            height: 96px;
            border-bottom: 1px solid @interval-color;
        }

        .detail-cnt {
            height: 325px;
            overflow-y: auto;

            .detail-fail-cell {
                height: 65px;
                border-bottom: 1px solid @interval-color;
                .font(@primary, 28px, 400, 64px);

                &::before {
                    content: '';
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background-color: @primary;
                    margin-right: 20px;
                    margin-top: 24px;
                }
            }

            .detail-success-cell {
                position: relative;
                padding-left: 36px;
                .font(@primary, 28px, 400, 64px);
                display: flex;
                flex-wrap: wrap;

                &::before {
                    content: '';
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background-color: @primary;
                    position: absolute;
                    left: 0;
                    top: 24px;
                }

                border-bottom: 1px solid @interval-color;
            }
        }
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
