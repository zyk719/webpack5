<template>
    <div class="user-crossroad">
        <div class="crossroad">
            <router-link tag="div" to="/user/supply" class="big-btn supply">
                茶标申领
            </router-link>
            <router-link tag="div" to="/user/number" class="big-btn number">
                标量查询
            </router-link>
            <router-link tag="div" to="/user/back" class="big-btn back">
                茶标退还
            </router-link>
            <router-link tag="div" to="/user/sign" class="big-btn sign" style="margin-left: 0;">
                协议签订
            </router-link>
            <!--
            <router-link
                tag="div"
                to="/user/supply_pack"
                class="big-btn supply-pack"
            >
                外包装申请
            </router-link>
            -->
            <router-link
                tag="div"
                to="/user/evaluation"
                class="big-btn evaluation"
            >
                订单评价
            </router-link>
        </div>
        <Sidebar class="sidebar" />
    </div>
</template>

<script>
import Sidebar from '@/views/business-user/sidebar/Sidebar'

export default {
    name: 'Crossroad',
    components: { Sidebar },
}
</script>

<style scoped lang="less">
.bigBtnBg(@iconUrl, @bgUrl, @shadowColor) {
    background-image: url(@iconUrl), url(@bgUrl);
    background-repeat: no-repeat;
    background-position: 50% 25%, 50%;
    text-shadow: 0 2px 5px @shadowColor;
}

.user-crossroad {
    padding: 95px 90px 0;
    display: flex;

    .crossroad {
        flex: auto;
        width: 0;

        // child style
        display: flex;
        //justify-content: space-between;
        justify-content: flex-start;
        align-content: flex-start;
        flex-wrap: wrap;

        .big-btn {
            & + .big-btn {
                margin-left: 50px;
            }

            display: inline-block;
            width: 380px;
            height: 350px;
            padding-top: 211px;
            text-align: center;
            cursor: pointer;
            margin-bottom: 50px;
            .font(#fff, 48px, 600, 67px, 4px);
        }

        .supply {
            .bigBtnBg('./icon-1.svg', './bg-1.svg', #1a462f);
        }

        .number {
            .bigBtnBg('./icon-2.svg', './bg-2.svg', #65511b);
        }

        .back {
            .bigBtnBg('./icon-3.svg', './bg-3.svg', #6e241e);
        }

        .sign {
            .bigBtnBg('./icon-4.svg', './bg-456.svg', #23637d);
        }

        .supply-pack {
            .bigBtnBg('./icon-5.svg', './bg-456.svg', #23637d);
        }

        .evaluation {
            .bigBtnBg('./icon-6.svg', './bg-456.svg', #23637d);
        }
    }
}
</style>
