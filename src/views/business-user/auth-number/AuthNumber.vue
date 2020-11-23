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
            const res = await this.$store.dispatch('openPrinter')
            console.log('open print back', res)
            const status = await this.$store.dispatch('getPrinterState')
            console.log('printer status', status)
            await this.$store.dispatch('print')
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
