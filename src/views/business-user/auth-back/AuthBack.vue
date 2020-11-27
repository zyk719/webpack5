<template>
    <div>
        <UserAuthTitle>茶标退还{{ status.warn ? '须知' : '' }}</UserAuthTitle>
        <div class="content" :style="status.back ? 'padding-top: 0;' : ''">
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
            <!-- 用户退标成功 -->
            <div v-show="status.success">
                <div class="title flex-center">
                    <span style="font-weight: bold; padding-right: 5px">{{
                        info.grower_name
                    }}</span
                    >先生，茶农编号<span
                        style="font-weight: bold; padding-left: 5px"
                        >{{ info.grower_code }}</span
                    >
                </div>
                <div class="title flex-center" style="margin-top: 60px">
                    您已成功退标成功：<span
                        style="
                            font-weight: bold;
                            font-size: 36px;
                            margin-right: 10px;
                        "
                        >{{ returnNum }}</span
                    >&nbsp;枚
                </div>
                <div class="title flex-center" style="margin-top: 40px">
                    当前账户剩余:<span class="boldFont"
                        >{{ info.valid_amount / 1000 }}千克</span
                    >茶标
                </div>
            </div>
            <!-- 服务端返回无可退标盒子时提示 -->
            <div v-show="status.forbid">
                <div class="flex-center">
                    <img
                        width="170"
                        height="170"
                        src="./surprised.svg"
                        alt="icon"
                    />
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
                >返回首页
            </AioBtn>
            <AioBtn v-show="status.warn" @click="statusTransfer('back')"
                >我已知晓
            </AioBtn>
            <AioBtn v-show="status.back" :loading="loading" @click="startBack"
                >开始退标
            </AioBtn>
            <!-- todo 用户忘记点完成退标，需自动提交：用户取走茶农卡时，如果在退标页且未提交 -->
            <AioBtn v-show="status.submit" :loading="loading" @click="doSubmit"
                >完成退标
            </AioBtn>
            <AioBtn
                v-show="
                    status.success && !$store.state.customer.takenCardCheckin
                "
                @click="reBack"
                >再退一笔</AioBtn
            >
        </div>
    </div>
</template>

<script>
import UserAuthTitle from '@/views/components/UserAuthTitle'
import AioBtn from '@/views/components/AioBtn'

import { putBackBoxCall, submitBackCall } from '@/api/bussiness/user'
import returnBox from '@/store/bussiness/returnBox'

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
            // this.$store.dispatch('readImageCheckin')
        },

        /** helpers */

        /** 用户事件 */
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
                const mark_count = this.$store.state.returnBox.count
                const equipmentbox_id = this.checkinBoxInfo.equipmentbox_id
                const params = {
                    equ_user_code,
                    detail_json: [
                        {
                            mark_count,
                            equipmentbox_id,
                            specifications: '250',
                        },
                    ],
                }
                const {
                    obj: {
                        growerInfoList: [{ return_num }],
                    },
                } = await submitBackCall(params)

                // 展示服务器对所退茶标的校验信息
                this.returnNum = return_num

                // 清空已提交的数据
                this.$store.commit('setCount', 0)

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
            this.statusTransfer('back')
        },
    },
}
</script>

<style scoped lang="less">
.content {
    width: 1200px;
    height: calc(100% - 399px);
    padding-top: 60px;
    margin: 0 auto;

    .tip {
        display: block;
        margin: 40px auto 0;
        width: 730px;
        height: 411px;
    }

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
}
</style>
