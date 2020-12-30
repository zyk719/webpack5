<template>
    <div style="position: relative">
        <UserAuthTitle style="padding-bottom: 30px"
            >茶标退还{{ status.warn ? '须知' : '' }}</UserAuthTitle
        >
        <div
            class="content"
            :style="status.back || status.success ? 'padding-top: 0;' : ''"
        >
            <!-- 退标提示 -->
            <div v-show="status.warn">
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
            <div v-show="status.failed" style="margin-top: 60px">
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
            <div v-show="status.back">
                <div class="title flex-center">
                    <span style="font-weight: bold; padding-right: 5px">{{
                        info.grower_name
                    }}</span
                    >先生，茶农编号<span
                        style="font-weight: bold; padding-left: 5px"
                        >{{ info.grower_code }}</span
                    >，请点击开始退标后，将茶标放入退标口：
                </div>
                <img class="tip" src="./happy.svg" alt="示意图" />
            </div>
            <!-- 用户完成退标操作 -->
            <div v-show="status.submit">
                <div class="title">&nbsp;</div>
                <div class="title flex-center" style="margin-top: 60px">
                    已接收您的退标数量为：<span
                        style="
                            font-weight: bold;
                            font-size: 60px;
                            margin-right: 10px;
                        "
                        >{{ $store.state.returnBox.count }}</span
                    >&nbsp;枚
                </div>
            </div>
            <!-- 退标信息展示 -->
            <div v-show="status.success">
                <div class="title flex-ac-fs">
                    <span class="boldFont">{{ info.grower_name }}</span>
                    &nbsp;先生，茶农编号：
                    <span class="boldFont">{{ info.grower_code }}</span>
                </div>
                <div class="title flex-ac-fs" style="margin-top: 25px">
                    您已成功退标：
                    <span class="boldFont">{{ returnNum }}</span>
                    &nbsp;枚，&nbsp;您账户剩余：
                    <span class="boldFont"
                        >{{ info.valid_amount / 1000 }}千克</span
                    >
                    &nbsp;茶标
                </div>
                <div
                    v-if="backSuccess.length"
                    class="title flex-ac-fs"
                    style="margin-top: 25px; flex-direction: column"
                >
                    <div
                        v-for="{
                            apply_code,
                            grower_code,
                            grower_name,
                            return_num,
                        } in backSuccess"
                        :key="apply_code"
                        style="margin-top: 15px"
                    >
                        <span>退标单号：</span>
                        <span class="boldFont">{{ apply_code }}</span>
                        <br />
                        <span>茶农编号：</span>
                        <span class="boldFont">{{ grower_code }}</span>
                        <span>茶农姓名：</span>
                        <span class="boldFont">{{ grower_name }}</span>
                        <span>退标数量：</span>
                        <span class="boldFont">250g * {{ return_num }}</span>
                    </div>
                </div>
                <div v-if="backFail.length" style="margin-top: 25px">
                    <div class="title">退标异常详情：</div>
                    <div
                        style="height: 166px; overflow: auto"
                        class="scroll-bar"
                    >
                        <div
                            v-for="{ mark_code, errorMsg } in backFail"
                            :key="mark_code"
                        >
                            <span class="error-sn">{{ mark_code }}</span>
                            <span class="error-sn">{{ errorMsg }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 服务端返回无可退标盒子时提示 -->
            <div v-show="status.forbid">
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
            <AioBtn v-show="status.submit" :loading="loading" @click="doSubmit"
                >完成退标</AioBtn
            >
            <AioBtn v-show="!printed && status.success" @click="handlePrint"
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

import { putBackBoxCall, submitBackCall } from '@/api/bussiness/user'
import returnBox from '@/store/bussiness/returnBox'
import { dateFormat, speakMsg } from '@/libs/treasure'

export default {
    name: 'AuthBack',
    components: { UserAuthTitle, AioBtn },
    data() {
        return {
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
            backSuccess: [],
            backFail: [],
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
        async handlePrint() {
            this.printed = true
            const { grower_name, grower_code } = this.info
            const fmt = 'yyyy-MM-dd HH:mm:ss'

            let backDetail = ''
            let num = 2
            while (num--) {
                backDetail +=
                    `     退标单号：ZZTB2020112515503376973\n\n` +
                    `     茶农编号：134523    茶农姓名：测试人员\n\n` +
                    `     退标数量：250g * 30枚\n\n`
                if (num >= 1) {
                    backDetail +=
                        '---------------------------------------------\n\n'
                }
            }

            const action = '退标'
            const content =
                '\n*********************************************\n\n' +
                `   茶 农 编 号：${grower_code}\n\n` +
                `   茶 农 姓 名：${grower_name}\n\n` +
                `   退 标 时 间：${dateFormat(fmt, new Date())}\n\n` +
                `   退 标 明 细：\n\n` +
                backDetail +
                '*********************************************\n'

            const params = { action, content }
            const res = await this.$store.dispatch('doPrint', params)
            speakMsg('success', `打印完成，请取走凭条`)
        },
        handleBack() {
            // todo 判断是否正在进标

            // 提交成功且退标过程中卡被取走
            if (
                this.status.success &&
                this.$store.state.customer.takenCardCheckin
            ) {
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
                this.$store.commit('setBarcode', [])

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
    height: calc(100% - 369px);
    padding-top: 60px;
    margin: 0 auto;

    .tip {
        display: block;
        margin: 40px auto 0;
        width: 730px;
        height: 411px;
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
        margin-left: 30px;
        .font(@primary, 28px);
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
