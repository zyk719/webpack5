<template>
    <div class="user-issue">
        <!-- 列表 -->
        <div v-show="!read" class="title-box flex-ac-js">
            <AioBtn
                width="191"
                height="65"
                :cancel="true"
                @click="goBackCrossroad"
            >
                <Icon type="ios-undo" />
                返回
            </AioBtn>
            <div class="title">常见问题</div>
            <div style="width: 191px; opacity: 0" />
        </div>
        <div v-show="!read" class="content">
            <div class="content-wrap scroll-bar">
                <div style="height: 585px">
                    <div
                        v-for="{ title, publish_DT, contentid } in list"
                        :key="title + publish_DT"
                        class="spoon flex-ac-js"
                        @click="handleRead(contentid)"
                    >
                        <span>{{ title }}</span>
                        <span>{{ publish_DT }}</span>
                    </div>
                </div>
                <AioPage
                    show-total
                    :page-size="params.rows"
                    v-show="!read"
                    :total="total"
                    :current.sync="params.page"
                    :key="aioPageKey"
                />
            </div>
        </div>
        <!-- 详情 -->
        <div v-show="read" class="title-box flex-ac-js">
            <AioBtn width="191" height="65" :cancel="true" @click="handleQuit">
                <Icon type="ios-undo" />
                返回
            </AioBtn>
            <div class="title">{{ readContent['TITLE'] }}</div>
            <div style="width: 191px; opacity: 0" />
            <div class="issue-date">
                {{ readContent.PUBLISH_DT.substr(0, 10) }}
            </div>
        </div>
        <div v-show="read" class="content">
            <div class="content-wrap">
                <div class="read-content" v-html="readContent.CONTENT" />
            </div>
        </div>
    </div>
</template>

<script>
import AioBtn from '@/views/components/AioBtn'
import AioPage from '@/views/components/AioPage'
import { newsCall, newsDetailsCall } from '@/api/bussiness/news'

export default {
    name: 'Issue',
    components: { AioBtn, AioPage },
    data() {
        return {
            aioPageKey: '',
            read: false,
            categoryCode: 'cat01_06',
            list: [],
            readContent: {
                PUBLISH_DT: '',
            },
            params: {
                page: 1,
                rows: 8,
            },
            total: 0,
        }
    },
    activated() {
        this.init()
    },
    deactivated() {
        this.params.page = 1
    },
    watch: {
        'params.page'() {
            this.getIssueList(this.categoryCode)
        },
    },
    methods: {
        init() {
            this.getIssueList(this.categoryCode)
        },

        /** 用户事件 */
        async handleRead(ID) {
            this.readContent = await this.getIssueDetail(ID)
            this.read = true
        },
        handleQuit() {
            this.read = false
        },

        /** helpers */
        goBackCrossroad() {
            this.$router.push('/user/crossroad')
        },

        /** 接口调用 */
        // 1. 问题列表
        async getIssueList(CATEGORYCODE) {
            const params = {
                ...this.params,
                CATEGORYCODE,
            }
            try {
                const { rows, total } = await newsCall(params)
                this.list = rows
                this.total = total
            } catch (e) {
                this.list = []
                this.total = 0
            } finally {
                this.aioPageKey = Math.random()
            }
        },
        // 2. 问题详情
        async getIssueDetail(ID) {
            const params = { ID }
            const { obj } = await newsDetailsCall(params)
            return obj
        },
    },
}
</script>

<style scoped lang="less">
.user-issue {
    padding: 0 40px;

    .title-box {
        height: 174px;
        position: relative;

        .title {
            .font(@primary, 56px, bold, 64px, 4px);
        }

        .issue-date {
            position: absolute;
            bottom: 5px;
            left: 50%;
            transform: translateX(-50%);
            height: 40px;
            text-align: center;
            .font(@primary, 28px, 600, 40px);
        }
    }

    .content {
        height: calc(100% - 214px);
        padding: 20px 25px 20px 40px;
        background-color: #d8edf2;

        .content-wrap {
            height: 100%;
            overflow-y: auto;
            padding-right: 9px;

            .spoon {
                height: 73px;
                cursor: pointer;
                border-bottom: 1px solid @primary;
                .font(@primary, 24px, 600);
            }

            .read-content {
                .font(@primary, 24px, 400, 33px);
                text-indent: 2em;

                p {
                    margin-bottom: 20px;
                }
            }
        }
    }
}
</style>
