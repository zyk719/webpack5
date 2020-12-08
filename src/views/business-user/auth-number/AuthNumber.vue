<template>
    <div>
        <UserAuthTitle>标量查询</UserAuthTitle>
        <div class="content">
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
                        {{ userCurrentNumber.entity_valid_amount / 1000 || 0 }}
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
                                    userCurrentNumber.freeze_amount / 1000 || 0
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
                        <span class="title" style="padding-left: 7px">亩</span>
                    </span>
                </div>
            </div>
        </div>
        <div style="text-align: center">
            <AioBtn :cancel="true" @click="handleBack"> 返回首页 </AioBtn>
            <AioBtn @click="handlePrint"> 凭条打印 </AioBtn>
        </div>
    </div>
</template>

<script>
import UserAuthTitle from '@/views/components/UserAuthTitle'
import AioBtn from '@/views/components/AioBtn'
import { speakMsg, dateFormat } from '@/libs/treasure'

export default {
    name: 'AuthNumber',
    components: { UserAuthTitle, AioBtn },
    computed: {
        userCurrentNumber() {
            return this.$store.state.cache.userCurrentNumber
        },
        info() {
            return this.$store.state.customer.info
        },
    },
    methods: {
        /** 用户事件 */
        handleBack() {
            this.$router.push('/user/crossroad')
        },
        // 凭条打印
        async handlePrint() {
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
                const content =
                    '\n' +
                    '*********************************************' +
                    '\n\n' +
                    `   茶 农 编 号：${grower_code}\n\n` +
                    `   茶 农 姓 名：${grower_name}\n\n` +
                    `   核 准 标 量：${all_amount / 1000 || 0}kg\n\n` +
                    `   划 转 标 量：${transfer_amount / 1000 || 0}kg\n\n` +
                    `   申 领 标 量：${entity_valid_amount / 1000 || 0}kg\n\n` +
                    `   剩 余 标 量：${rm / 1000 || 0}kg（含冻结量：${
                        fm / 1000 || 0
                    }kg）\n\n` +
                    `   茶 地 面 积：${tea_area || 0} 亩\n\n` +
                    `   查 询 时 间：${dateFormat(fmt, new Date())}\n\n` +
                    '*********************************************' +
                    '\n'

                this.$store.dispatch('lightPrinter')
                const res = await this.$store.dispatch('doPrint', {
                    action: '查询',
                    content,
                })
                speakMsg('success', `${res}，请取走凭条`)
                // todo 打印全局控制
                // todo 检查打印机状态，不能用时置灰按钮
            } catch (e) {
                console.error(e)
            } finally {
                setTimeout(() => {
                    this.$store.dispatch('closePrinterLight')
                }, 1000)
            }
        },
    },
    mounted() {
        this.$store.dispatch('getUserCurrentNumber')
    },
}
</script>

<style scoped lang="less">
@primary-color: @primary;

.content {
    width: 1100px;
    height: calc(100% - 399px);
    padding-top: 30px;
    margin: 0 auto;

    .title {
        flex: 0 0 auto;
        font-size: 36px;
        font-weight: 400;
        color: @primary-color;
    }

    .text {
        font-size: 48px;
        font-weight: 600;
        color: @primary-color;
    }
}
</style>
