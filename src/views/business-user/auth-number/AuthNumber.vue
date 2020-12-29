<template>
    <div>
        <UserAuthTitle>标量查询</UserAuthTitle>
        <div class="content">
            <div v-show="canQuery">
                <div class="title flex-ac-fs">
                    <span style="font-weight: bold; padding-right: 5px">
                        {{ info.grower_name }}
                    </span>
                    先生，茶农编号
                    <span style="font-weight: bold; padding-left: 5px">
                        {{ info.grower_code }}
                    </span>
                    ，您好，您的标量信息如下：
                </div>
                <div style="margin-top: 60px" class="flex-ac-fs">
                    <div style="width: 500px" class="flex-ac-fs">
                        <span class="title">核准量：</span>
                        <span class="text flex-ac-js">
                            {{ userCurrentNumber.all_amount / 1000 || 0 }}
                            <span class="title" style="padding-left: 7px">
                                千克
                            </span>
                        </span>
                    </div>
                    <div class="flex-ac-fs">
                        <span class="title">划转量：</span>
                        <span class="text flex-ac-js">
                            {{ userCurrentNumber.transfer_amount / 1000 || 0 }}
                            <span class="title" style="padding-left: 7px">
                                千克
                            </span>
                        </span>
                    </div>
                </div>
                <div style="margin-top: 40px" class="flex-ac-fs">
                    <div style="flex: 0 0 500px" class="flex-ac-fs">
                        <span class="title">申领量：</span>
                        <span class="text flex-ac-js">
                            {{
                                userCurrentNumber.entity_valid_amount / 1000 ||
                                0
                            }}
                            <span class="title" style="padding-left: 7px">
                                千克
                            </span>
                        </span>
                    </div>
                    <div class="flex-ac-fs">
                        <span class="title">剩余量：</span>
                        <span class="text flex-ac-js">
                            {{ userCurrentNumber.remaining_amount / 1000 || 0 }}
                            <span class="title" style="padding-left: 7px">
                                千克
                            </span>
                            <span
                                class="title"
                                style="display: flex; align-items: center"
                            >
                                （含冻结量：
                                <span class="text">
                                    {{
                                        userCurrentNumber.freeze_amount /
                                            1000 || 0
                                    }}
                                </span>
                                &nbsp;千克）
                            </span>
                        </span>
                    </div>
                </div>
                <div style="margin-top: 40px" class="flex-ac-fs">
                    <div style="width: 500px" class="flex-ac-fs">
                        <span class="title">茶地面积：</span>
                        <span class="text flex-ac-js">
                            {{ userCurrentNumber.tea_area || 0 }}
                            <span class="title" style="padding-left: 7px"
                                >亩</span
                            >
                        </span>
                    </div>
                </div>
            </div>
            <div v-show="!canQuery">
                <div class="flex-center">
                    <img width="170" height="170" src="./sad.svg" alt="icon" />
                    <div style="height: 170px; margin-left: 60px">
                        <div class="title" style="line-height: 170px">
                            未开放查询！
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div style="text-align: center">
            <AioBtn :cancel="true" @click="handleBack">返回首页</AioBtn>
            <AioBtn
                v-if="!printed && $store.getters.printerOk"
                @click="handlePrint"
                >凭条打印</AioBtn
            >
        </div>
        <!-- 状态查询蒙层 -->
        <Spin fix v-if="$store.state.cache.getOpenStatusLoading">
            <Icon class="demo-spin-icon-load" type="ios-loading" :size="50" />
            <div>查询开放状态查询中...</div>
        </Spin>
    </div>
</template>

<script>
import UserAuthTitle from '@/views/components/UserAuthTitle'
import AioBtn from '@/views/components/AioBtn'
import { speakMsg, dateFormat } from '@/libs/treasure'
import printer from '@/store/bussiness/printer'

export default {
    name: 'AuthNumber',
    components: { UserAuthTitle, AioBtn },
    data() {
        return {
            printed: false,
        }
    },
    computed: {
        userCurrentNumber() {
            return this.$store.state.cache.userCurrentNumber
        },
        info() {
            return this.$store.state.customer.info
        },
        canQuery() {
            const value = this.$store.state.cache.isOpen.is_can_query_grower
            if (value === '2') {
                return false
            } else if (value === '1') {
                return true
            }
        },
    },
    methods: {
        /** 用户事件 */
        handleBack() {
            this.$router.push('/user/crossroad')
        },
        // 凭条打印
        async handlePrint() {
            // todo 进页面打印机不能用，按钮置灰
            this.printed = true

            try {
                const { grower_name, grower_code } = this.info
                const {
                    all_amount,
                    transfer_amount,
                    entity_valid_amount,
                    remaining_amount: rm,
                    freeze_amount: fm,
                    tea_area,
                } = this.userCurrentNumber
                const fmt = 'yyyy-MM-dd HH:mm:ss'

                /**
                 * 打印参数
                 * 1. 打印行为：action = 查询
                 * 2. 打印内容：content
                 */
                const action = '查询'
                const content =
                    '\n*********************************************\n\n' +
                    `   茶 农 编 号：${grower_code}\n\n` +
                    `   茶 农 姓 名：${grower_name}\n\n` +
                    `   核 准 标 量：${all_amount / 1000 || 0}kg\n\n` +
                    `   划 转 标 量：${transfer_amount / 1000 || 0}kg\n\n` +
                    `   申 领 标 量：${entity_valid_amount / 1000 || 0}kg\n\n` +
                    `   剩 余 标 量：${rm / 1000 || 0}kg（含冻结量：${
                        fm / 1000 || 0
                    }kg）\n\n` +
                    `   茶 地 面 积：${tea_area || 0} 亩\n\n` +
                    `   查 询 时 间：${dateFormat(fmt, new Date())}` +
                    '\n\n*********************************************\n'

                const params = { action, content }
                await this.$store.dispatch('doPrint', params)
            } catch (e) {
                console.error(e)
            }
        },
    },
    mounted() {
        this.$store.dispatch('getUserCurrentNumber')
        // 重新查询申领|退标|查询状态
        this.$store.dispatch('getCheckoutCheckinStatus')
    },
}
</script>

<style scoped lang="less">
.content {
    width: 1100px;
    height: calc(100% - 399px);
    padding-top: 30px;
    margin: 0 auto;

    .title {
        flex: 0 0 auto;
        .font(@primary, 36px, 400);
    }

    .text {
        .font(@primary, 48px, 600);
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
