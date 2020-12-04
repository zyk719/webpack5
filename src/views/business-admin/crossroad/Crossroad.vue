<template>
    <div class="crossroad flex-center">
        <router-link tag="div" class="big-btn save" to="/admin/put_tea_sign">
            茶标存放
        </router-link>
        <router-link tag="div" class="big-btn take" to="/admin/take_tea_sign">
            领标取出
        </router-link>
        <router-link
            tag="div"
            class="big-btn back"
            to="/admin/take_tea_sign_back"
        >
            退标取出
        </router-link>
        <router-link tag="div" class="big-btn view" to="/admin/log">
            记录查看
        </router-link>
        <AioBtn
            class="clear-fault-btn"
            :cancel="true"
            style="right: 428px"
            width="125"
            height="60"
            @click="existAdmin"
        >
            返回
        </AioBtn>
        <AioBtn
            class="clear-fault-btn"
            style="right: 280px"
            width="125"
            height="60"
            @click="refreshPage"
        >
            刷新
        </AioBtn>
        <AioBtn
            class="clear-fault-btn"
            width="225"
            height="60"
            :loading="loading"
            @click="clearFault"
        >
            故障清除
        </AioBtn>
    </div>
</template>

<script>
import AioBtn from '@/views/components/AioBtn'

import { clearFaultCall } from '@/api/bussiness/admin'

export default {
    name: 'Crossroad',
    components: { AioBtn },
    data() {
        return {
            loading: false,
        }
    },
    methods: {
        existAdmin() {
            this.$router.push('/user/crossroad')
        },

        refreshPage() {
            window.location.reload()
        },

        // todo 清除前需判断 mac 地址已拿到
        async clearFault() {
            try {
                this.loading = true
                const { msg } = await clearFaultCall({})
                this.$Message.success(msg)
            } finally {
                this.loading = false
            }
        },
    },
}
</script>

<style scoped lang="less">
.bigBtnBg(@iconUrl, @bgUrl, @shadowColor) {
    background-image: url(@iconUrl), url(@bgUrl);
    background-repeat: no-repeat;
    background-position: 50% 34.8572%, 50%;
    background-size: auto, cover;
    text-shadow: 0 2px 5px @shadowColor;
    border-radius: 15px;
}

.crossroad {
    position: relative;

    .big-btn {
        display: inline-block;
        width: 360px;
        height: 522px;
        padding-top: 300px;
        text-align: center;
        cursor: pointer;

        & + .big-btn {
            margin-left: 88px;
        }

        .font(#fff, 48px, 600, 67px, 4px);
    }

    .save {
        .bigBtnBg('./save-icon.svg', './save-bg.svg', #1a462f);
    }

    .take {
        .bigBtnBg('./take-icon.svg', './take-bg.svg', #65511b);
    }

    .back {
        .bigBtnBg('./back-icon.svg', './back-bg.svg', #65511b);
    }

    .view {
        .bigBtnBg('./view-icon.svg', './view-bg.svg', #23637d);
    }

    .clear-fault-btn {
        position: absolute;
        right: 33px;
        top: 33px;
    }
}
</style>
