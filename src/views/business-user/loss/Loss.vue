<template>
    <div>
        <UserAuthTitle>茶农卡挂失</UserAuthTitle>
        <div class="content">
            <div v-show="status.fill">
                <Form
                    label-colon
                    ref="form"
                    :model="params"
                    :rules="rules"
                    class="form"
                >
                    <FormItem label="手机号" prop="mobile">
                        <AioInput
                            placeholder="请输入手机号"
                            v-model="params.mobile"
                            @click.native="showIme"
                            @on-blur="hideIme()"
                        />
                    </FormItem>
                    <FormItem label="验证码" prop="randnum">
                        <AioInput
                            placeholder="请输入验证码"
                            v-model="params.randnum"
                            @click.native="showIme"
                            @on-blur="hideIme()"
                            @keydown.native.enter="getCardInfo"
                        />
                        <Button
                            :disabled="countNumber > 0"
                            :loading="validLoading"
                            @click="sendMsg"
                            type="primary"
                            class="valid-code-btn"
                        >
                            获取验证码<span v-show="countNumber > 0">
                                ({{ countNumber }})
                            </span>
                        </Button>
                    </FormItem>
                </Form>
            </div>
            <div v-show="status.submit">
                <div class="title">请核对茶农卡信息：</div>
                <div style="margin-top: 60px;" class="flex-ac-fs">
                    <div style="width: 620px;" class="flex-ac-fs">
                        <span class="title">茶农编号：</span>
                        <span class="text">
                            {{ cardOwnerInfo.grower_code }}
                        </span>
                    </div>
                    <div class="flex-ac-fs">
                        <span class="title">茶农姓名：</span>
                        <span class="text">
                            {{ cardOwnerInfo.grower_name }}
                        </span>
                    </div>
                </div>
                <div style="margin-top: 40px;" class="flex-ac-fs">
                    <div style="width: 620px;" class="flex-ac-fs">
                        <span class="title">联系电话：</span>
                        <span class="text">{{ cardOwnerInfo.phone }}</span>
                    </div>
                    <div class="flex-ac-fs">
                        <span class="title">茶农地址：</span>
                        <span
                            class="text"
                            style="width: 366px;align-items: baseline;"
                        >
                            {{ cardOwnerInfo.addr }}
                        </span>
                    </div>
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
                    <div
                        style="height: 170px;line-height: 170px;margin-left: 60px;"
                    >
                        <div class="title">茶农卡已挂失，请尽快申请补卡。</div>
                    </div>
                </div>
            </div>
        </div>
        <div style="text-align: center;">
            <AioBtn
                :disabled="loading"
                :cancel="true"
                @click="$router.push('/user/crossroad')"
            >
                返回首页
            </AioBtn>
            <AioBtn
                v-show="status.fill"
                :loading="loading"
                @click="getCardInfo"
            >
                下一步
            </AioBtn>
            <AioBtn
                v-show="status.submit"
                :loading="loading"
                @click="submitLoss"
            >
                确认挂失
            </AioBtn>
        </div>
    </div>
</template>

<script>
import UserAuthTitle from '@/views/components/UserAuthTitle'
import AioInput from '@/views/components/AioInput'
import AioBtn from '@/views/components/AioBtn'

// helpers
import config from '@/config'
import { validateField, rulePhone } from '@/libs/athena'
import { doInterval } from '@/libs/treasure'
import {
    msgTokenCall,
    msgCall,
    cardOwnerCall,
    lossCall,
} from '@/api/bussiness/user'

export default {
    name: 'Loss',
    components: { UserAuthTitle, AioBtn, AioInput },
    data() {
        return {
            status: {
                fill: true,
                submit: false,
                success: false,
            },
            params: {
                mobile: '',
                randnum: '',
            },
            rules: {
                // mobile: rulePhone(),
                randnum: {
                    required: true,
                    message: '请输入验证码',
                    trigger: 'change',
                },
            },
            countNumber: 0,
            validLoading: false,
            loading: false,
            cardOwnerInfo: {
                grower_name: '',
                grower_code: '',
                phone: '',
                addr: '',
                token: '',
            },
        }
    },
    mounted() {
        this.init()
    },
    methods: {
        init() {},

        /** helpers */
        showIme() {
            this.$store.dispatch('showIme', 'num_s')
        },
        hideIme() {
            this.$store.dispatch('hideIme')
        },

        /** 验证码倒计时 */
        countDown: doInterval(config.COUNT_DOWN_LONG, 1000),
        setCountDown() {
            this.countNumber = config.COUNT_DOWN_LONG
            this.countDown(() => this.countNumber--)
        },

        /** 接口调用 */
        // 1. 换短信验证码 token
        async getMsgToken() {
            const {
                obj: { token },
            } = await msgTokenCall({})
            return token
        },
        // 2. 发送短信验证码
        async sendMsg() {
            const valid = await validateField(this.$refs.form, 'mobile')
            if (!valid) {
                return
            }

            const params = {
                msgtype: 1,
                token: await this.getMsgToken(),
                mobile: this.params.mobile,
            }
            try {
                this.validLoading = true
                await msgCall(params)
                this.setCountDown()
            } finally {
                this.validLoading = false
            }
        },

        /** 流程控制 */
        // 控制状态流
        statusTransfer(target) {
            Object.keys(this.status).forEach(key => (this.status[key] = false))
            this.status[target] = true
        },
        async getCardInfo() {
            const valid = await this.$refs.form.validate()
            if (!valid) {
                return
            }

            try {
                this.loading = true
                const params = { ...this.params }
                const { obj } = await cardOwnerCall(params)
                this.cardOwnerInfo = obj
                this.statusTransfer('submit')
            } finally {
                this.loading = false
            }
        },
        async submitLoss() {
            try {
                this.loading = true
                const params = {
                    token: this.cardOwnerInfo.token,
                }
                const { msg } = await lossCall(params)
                this.$Message.success(msg)
                this.statusTransfer('success')
            } finally {
                this.loading = false
            }
        },
    },
}
</script>

<style scoped lang="less">
@primary-color: @primary;

.content {
    width: 1180px;
    height: calc(100% - 399px);
    padding-top: 20px;
    margin: 0 auto;

    .title {
        font-size: 36px;
        font-weight: 400;
        color: @primary-color;
    }

    .text {
        font-size: 48px;
        font-weight: 600;
        color: @primary-color;
    }

    .boldFont {
        font-size: 36px;
        font-weight: 600;
        color: @primary-color;
    }

    .interval {
        margin: 0 20px;
        text-align: center;
        font-size: 36px;
        font-weight: 400;
        color: @primary-color;
    }
}

.form {
    width: 800px;
    margin: 0 auto;

    /deep/ .ivu-form-item {
        margin-bottom: 30px;
    }

    /deep/ .ivu-form-item-label {
        color: @primary-color;
        font-size: 32px;
        font-weight: 600;
        line-height: 45px;
        margin-bottom: 20px;

        &::before {
            font-size: inherit;
        }
    }

    /deep/ .ivu-form-item-error-tip {
        font-size: 28px;
    }

    .valid-code-btn {
        position: absolute;
        bottom: 15px;
        right: 15px;

        width: 225px;
        height: 55px;
        border-radius: 4px;
        background: #5eb3d7;
        color: #fff;
        font-size: 28px;
        font-weight: 600;

        &[disabled] {
            cursor: not-allowed;
            border-color: #c5c8ce;
            background-color: #c5c8ce;
        }
    }
}
</style>
