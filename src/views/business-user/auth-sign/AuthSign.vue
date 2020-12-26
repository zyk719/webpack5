<template>
    <div class="flex-column">
        <UserAuthTitle style="padding: 36px 0">协议签订</UserAuthTitle>
        <div class="main flex-column">
            <div class="text scroll-bar">
                <Agreement />
            </div>
            <div class="sign-btn flex-ac-fs">
                <Checkbox v-if="!isSign" :disabled="isSign" v-model="approve"
                    >同意以上协议条款，</Checkbox
                >
                <span class="title">签名：</span>
                <img
                    style="border-bottom: 2px solid #333"
                    v-show="imgUrl"
                    :src="imgUrl"
                    height="77"
                    alt="sign"
                />
                <AioBtn
                    v-show="!imgUrl"
                    width="177"
                    height="60"
                    @click="onOpenESign"
                    >点击签名</AioBtn
                >
            </div>
        </div>
        <div class="footer flex-center">
            <AioBtn
                :disabled="loading"
                :cancel="true"
                @click="$router.push('/user/crossroad')"
                >返回首页</AioBtn
            >
            <AioBtn v-show="!isSign" :loading="loading" @click="submit"
                >签订</AioBtn
            >
        </div>
        <div class="modal-sign" v-show="showSign">
            <ESign ref="eSign" @finish="onFinish" />
        </div>
    </div>
</template>

<script>
import UserAuthTitle from '@/views/components/UserAuthTitle'
import AioBtn from '@/views/components/AioBtn'
import ESign from '@/views/business-user/auth-sign/ESign'
import Agreement from '@/views/business-user/auth-sign/Agreement'

import { signCall } from '@/api/bussiness/user'
import { createFormData, fileMD5, uploadFile } from '@/libs/treasure'

export default {
    name: 'AuthSign',
    components: { UserAuthTitle, AioBtn, ESign, Agreement },
    data() {
        return {
            approve: true,
            showSign: false,
            loading: false,
        }
    },
    watch: {
        approve(nv) {
            nv && (this.showSign = true)
        },
    },
    computed: {
        code() {
            return this.$store.state.customer.code
        },
        isSign() {
            return this.$store.state.cache.isSign
        },
        imgUrl() {
            return this.$store.state.cache.imgUrl
        },
    },
    mounted() {
        this.$store.dispatch('getSignStatus')
    },
    methods: {
        /** 交互 */
        onOpenESign() {
            this.showSign = true
        },
        async submit() {
            if (!this.approve) {
                this.$Message.warning({
                    content: '请仔细阅读协议，同意并签名后再提交',
                    duration: 5,
                    closable: true,
                })
                return
            }

            const blobs = await this.$refs.eSign.getBlob()
            if (blobs.size === this.$refs.eSign.emptySize) {
                this.$Message.warning('请签名后再提交')
                return
            }

            try {
                this.loading = true

                const params = {
                    file: blobs,
                    uniqueid: await fileMD5(blobs),
                    equ_user_code: this.code,
                }
                // todo 换成茶农姓名
                const formData = createFormData(params, 'sign')
                // 上传文件
                await uploadFile(formData)
                // 上传签名
                const signParams = {
                    equ_user_code: this.code,
                    sign_img: params.uniqueid,
                }
                await signCall(signParams)
                // 更新页面
                await this.$store.dispatch('getSignStatus')
            } finally {
                this.loading = false
            }
        },

        onFinish(imgUrl) {
            this.showSign = false
            this.$store.commit('setSignImgUrl', imgUrl)
        },
    },
}
</script>

<style scoped lang="less">
.main {
    flex: auto;
    height: 0;
    margin: 0 40px;
    background: #d8edf2;
    padding: 40px 25px 0 40px;

    .text {
        padding-right: 9px;
        flex: auto;
        height: 0;
        overflow-y: auto;
        .font(rgb(0, 0, 0), 24px, 400, 33px);
    }

    .sign-btn {
        flex: 0 0 120px;
    }
}

.title {
    .font(@primary, 28px, 600, 40px);
}

.footer {
    flex: 0 0 175px;
}

.modal-sign {
    position: fixed;
    z-index: 9;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(55, 55, 55, 0.6);

    .e-sign {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
}

/deep/ .ivu-checkbox-inner {
    width: 32px;
    height: 32px;
}
/deep/ .ivu-checkbox-checked .ivu-checkbox-inner:after {
    width: 8px;
    height: 16px;
    top: 5px;
    left: 10px;
    border: 4px solid #fff;
    border-top: 0;
    border-left: 0;
}
/deep/ .ivu-checkbox-wrapper {
    .font(@primary, 28px, 600, 40px);
}
/deep/ .ivu-checkbox-disabled.ivu-checkbox-checked .ivu-checkbox-inner {
    background-color: #2d8cf0;
    border-color: #2d8cf0;
}
</style>
