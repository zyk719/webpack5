<template>
    <div class="user-info">
        <TopBar @onClick="goBackCrossroad" />
        <div class="content">
            <InfoSide class="switch" v-model="curSwitch" />
            <div class="main">
                <div style="height: 585px" v-show="status.display">
                    <div
                        v-for="item in list"
                        :key="item.title + item.publish_DT"
                        @click="handleRead(item.contentid, item)"
                        class="spoon"
                    >
                        <span
                            class="title"
                            style="
                                text-overflow: ellipsis;
                                overflow: hidden;
                                white-space: nowrap;
                            "
                        >
                            <!-- icon -->
                            <Icon
                                class="demo-spin-icon-load"
                                type="ios-loading"
                                v-show="item.loading"
                            />
                            {{ item.title }}
                        </span>
                        <span
                            class="date"
                            style="width: 200px; text-align: right"
                        >
                            {{ item.publish_DT }}
                        </span>
                    </div>
                </div>
                <AioPage
                    show-total
                    :page-size="params.rows"
                    v-show="status.display"
                    :total="total"
                    :current.sync="params.page"
                />

                <!-- 内容 -->
                <div v-show="status.read" class="read">
                    <div class="content-box scroll-bar" ref="display">
                        <div class="title">{{ readContent['TITLE'] }}</div>
                        <div class="date">
                            {{ readContent.PUBLISH_DT.substr(0, 10) }}
                            <span style="display: inline-block; width: 30px" />
                            阅读量：{{ readContent.readCount }}
                        </div>
                        <div class="read-content">
                            <video
                                autoplay
                                controls
                                ref="mp4"
                                controlslist="nodownload"
                                disablePictureInPicture="true"
                                :src="item.HASHCODE"
                                v-for="(item,
                                idx) in readContent.showvideosList"
                                :key="idx"
                                style="
                                    width: 65%;
                                    display: block;
                                    margin: 0 auto 10px;
                                "
                            />
                            <div v-html="content" />
                        </div>
                    </div>
                    <div class="footer flex-center">
                        <div
                            class="back-display-btn flex-center"
                            @click="statusTransfer('display')"
                        >
                            返回
                        </div>
                    </div>
                </div>

                <!-- 加载中 -->
                <Spin fix v-if="loading">
                    <Icon
                        class="demo-spin-icon-load"
                        type="ios-loading"
                        :size="50"
                    />
                    <div>列表加载中...</div>
                </Spin>
            </div>
        </div>
    </div>
</template>

<script>
import AioBtn from '@/views/components/AioBtn'
import AioPage from '@/views/components/AioPage'
import TopBar from '@/views/business-user/topBar/TopBar'
import InfoSide from '@/views/business-user/info/InfoSide'

/** helpers */
import { newsCall, newsDetailsCall, newsReadCount } from '@/api/bussiness/news'

const preReadContent = () => ({
    PUBLISH_DT: '',
    readCount: 0,
    showvideosList: [],
})

export default {
    name: 'Info',
    components: { AioBtn, AioPage, InfoSide, TopBar },
    data() {
        return {
            curSwitch: undefined,
            params: {
                page: 1,
                rows: 8,
            },
            list: [],
            total: 0,
            status: {
                display: true,
                read: false,
            },
            readContent: preReadContent(),
            loading: false,
        }
    },
    computed: {
        content() {
            let content = this.readContent['CONTENT']
            if (content && content.includes('<img')) {
                const interval = 'img src="'
                const host = 'http://www.xhlj.org.cn'
                const arr = content.split(interval)
                content = arr.join(`${interval}${host}`)
            }
            return content
        },
    },
    watch: {
        curSwitch(nv, ov) {
            // 回列表页
            this.statusTransfer('display')

            // 点击到其它新闻
            // 1. 清除已经在加载的 loading
            const hasRead = this.list.find((row) => row.loading)
            if (hasRead) {
                hasRead.loading = false
            }

            // 请求内容列表
            this.params.page === 1
                ? this.getNews(this.curSwitch, !!ov)
                : (this.params.page = 1)
        },
        'params.page'() {
            this.getNews(this.curSwitch)
        },
    },
    activated() {
        this.getNews(this.curSwitch, false)
    },
    deactivated() {
        this.statusTransfer('display')
    },
    methods: {
        init() {
            this.getNews(this.curSwitch)
        },

        /** 流程控制 */
        // 控制状态流
        statusTransfer(target) {
            if (target === 'display') {
                this.readContent = preReadContent()
                this.$refs.display.scrollTop = 0
            }
            Object.keys(this.status).forEach(
                (key) => (this.status[key] = false)
            )
            this.status[target] = true
        },

        /** 用户事件 */
        handleBack() {
            this.goBackCrossroad()
        },
        handleToggle(value) {
            if (this.curSwitch === value) {
                return
            }
            this.curSwitch = value
            this.statusTransfer('display')
        },
        async handleRead(ID, row) {
            if (row.loading) {
                return
            }

            // 点击到其它新闻
            // 1. 清除已经在加载的 loading
            const hasRead = this.list.find((row) => row.loading)
            if (hasRead) {
                hasRead.loading = false
            }

            try {
                if ('loading' in row) {
                    row.loading = true
                } else {
                    this.$set(row, 'loading', true)
                }

                const params = { ID }
                const { obj } = await newsDetailsCall(params)
                if (row.loading) {
                    this.readContent = obj
                    this.statusTransfer('read')
                }
            } finally {
                row.loading = false
            }

            const paramsCount = { id: ID }
            const { obj: readCount } = await newsReadCount(paramsCount)
            this.$set(this.readContent, 'readCount', readCount)
        },

        goBackCrossroad() {
            this.$router.push('/user/crossroad')
        },

        /** 接口请求 */
        // 茶企 cat06_02
        async getNews(CATEGORYCODE, needLoading = true) {
            if (!CATEGORYCODE) {
                return
            }

            try {
                needLoading && (this.loading = true)
                const params = {
                    ...this.params,
                    CATEGORYCODE,
                }
                const { rows, total } = await newsCall(params)
                this.list = rows
                this.total = total
            } catch (e) {
                this.list = []
                this.total = 0
            } finally {
                needLoading && (this.loading = false)
            }
        },
    },
}
</script>

<style scoped lang="less">
.user-info {
    padding: 0 40px 40px;
    display: flex;
    flex-direction: column;

    .content {
        flex: auto;
        height: 0;

        display: flex;

        .switch {
            width: 360px;
            margin-right: 40px;
        }

        .main {
            flex: auto;
            height: 100%;
            overflow-y: auto;
            background: #d8edf2;
            padding: 20px 35px 2px 35px;
            position: relative;

            .spoon {
                height: 73px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
                border-bottom: 1px solid @primary;
                .font(@primary, 24px, 600);
            }

            .read {
                height: 100%;
                display: flex;
                flex-direction: column;

                .content-box {
                    flex: auto;
                    height: 0;
                    overflow-y: auto;
                    padding-right: 9px;

                    .title {
                        margin-top: 20px;
                        margin-bottom: 5px;
                        text-align: center;
                        .font(@primary, 28px, 600, 40px);
                    }

                    .date {
                        text-align: center;
                        margin-bottom: 20px;
                        .font(@primary, 20px, 600, 28px);
                    }

                    .read-content {
                        text-indent: 2em;
                        .font(@primary, 24px, 400, 33px);

                        p {
                            margin-bottom: 20px;
                        }
                    }
                }

                .footer {
                    flex: 0 0 80px;

                    .back-display-btn {
                        width: 400px;
                        height: 63px;
                        background: #5eb3d7;
                        border-radius: 12px;
                        cursor: pointer;
                        .font(#fff, 24px, 600);
                    }
                }
            }
        }
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
