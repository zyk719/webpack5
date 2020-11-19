<template>
    <div class="admin-login">
        <div class="title">管理员登录</div>
        <Form
            label-colon
            ref="form"
            class="form"
            :rules="rules"
            :model="params"
        >
            <FormItem label="用户名" prop="loginname">
                <AioInput
                    type="text"
                    placeholder="请输入用户名"
                    v-model="params.loginname"
                    @click.native="showIme('en')"
                    @on-blur="hideIme()"
                />
            </FormItem>
            <FormItem label="密码" prop="passwd">
                <AioInput
                    type="password"
                    placeholder="请输入密码"
                    v-model="params.passwd"
                    @click.native="showIme('en')"
                    @on-blur="hideIme()"
                />
            </FormItem>
            <FormItem label="验证码" prop="randNum">
                <AioInput
                    type="text"
                    placeholder="请输入验证码"
                    v-model="params.randNum"
                    @keydown.native.enter="handleLogin"
                    @click.native="showIme('num_s')"
                    @on-blur="hideIme()"
                />
                <RandNum ref="randNum" class="rand" />
            </FormItem>
            <div class="flex-ac-js">
                <AioBtn
                    width="390"
                    :disabled="loading"
                    :cancel="true"
                    @click="$router.push('/user/crossroad')"
                    style="width: 100%;margin-top: 30px;"
                >
                    返回
                </AioBtn>
                <AioBtn
                    width="390"
                    :loading="loading"
                    @click="handleLogin"
                    style="width: 100%;margin-top: 30px;"
                >
                    登录
                </AioBtn>
            </div>
        </Form>
    </div>
</template>

<script>
import RandNum from '@/views/components/rand-num'
import AioBtn from '@/views/components/AioBtn'
import AioInput from '@/views/components/AioInput'

import { login } from '@/api/app/user'
import { ruleString } from '@/libs/athena'

export default {
    name: 'AdminLogin',
    components: { AioBtn, AioInput, RandNum },
    data() {
        return {
            params: {
                loginname: '',
                passwd: '',
                randNum: '',
            },
            rules: {
                loginname: ruleString('用户名'),
                passwd: ruleString('密码'),
                randNum: ruleString('验证码'),
            },
            loading: false,
        }
    },
    methods: {
        /** helpers */
        showIme(type) {
            this.$store.dispatch('showIme', type)
        },
        hideIme() {
            this.$store.dispatch('hideIme')
        },

        /** 用户事件 */
        async handleLogin() {
            const valid = await this.$refs.form.validate()
            if (!valid) {
                return
            }
            try {
                this.loading = true
                await this.$store.dispatch('adminLogin', this.params)
                this.goCrossroad()
            } catch (e) {
                this.$refs.randNum.createRandUrl()
            } finally {
                this.loading = false
            }
        },

        /** helpers */
        goCrossroad() {
            this.$router.push('/admin/crossroad')
        },
    },
}
</script>

<style scoped lang="less">
.admin-login {
    padding-top: 60px;

    .title {
        .font(@primary, 56px, bold, 64px, 4px);
        text-align: center;
    }

    // form 样式修改放到全局
    .form {
        width: 800px;
        margin: 30px auto 0;

        /deep/ .ivu-form-item {
            margin-bottom: 30px;
        }
        /deep/ .ivu-form-item-label {
            .font(@primary, 32px, 600, 45px);
            margin-bottom: 10px;

            &::before {
                font-size: inherit;
            }
        }
        /deep/ .ivu-form-item-error-tip {
            font-size: 28px;
        }
    }

    .rand {
        height: 60px;
        position: absolute;
        right: 10px;
        bottom: 13px;
    }
}
</style>
