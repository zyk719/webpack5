<template>
    <div class="user-video flex-ac-fs">
        <div class="video-list">
            <AioBtn
                width="191"
                height="65"
                style="margin: 55px 0"
                :cancel="true"
                @click="goBackCrossroad"
            >
                <Icon type="ios-undo" />
                返回
            </AioBtn>
            <div class="list scroll-bar">
                <video
                    class="cell"
                    v-for="(item, idx) in videos"
                    :key="item.id"
                    :src="item.url"
                    @click="handlePlay(idx)"
                />
            </div>
        </div>
        <div class="video flex-center">
            <video
                controls
                controlsList="nodownload"
                disablePictureInPicture="true"
                autoplay
                style="height: 95%; width: 100%"
                ref="mp4"
                :src="(videos[currentIdx] || {}).url || ''"
            />
        </div>
    </div>
</template>

<script>
// todo 播放与暂停的 mask
import AioBtn from '@/views/components/AioBtn'

import { log } from '@/libs/treasure'
import { newsCall, newsDetailsCall } from '@/api/bussiness/news'

export default {
    name: 'Video',
    components: { AioBtn },
    data() {
        return {
            videos: [],
            cacheIds: new Set(),
            categoryCode: 'cat01_05',
            currentIdx: 0,
            long: 0,
            touched: false,
            timeId: 0,
        }
    },
    beforeDestroy() {
        clearInterval(this.timeId)
    },
    mounted() {
        this.init()
    },
    activated() {
        this.replay()
        this.getVideoLink()
    },
    methods: {
        init() {
            this.loopPlay()
        },

        /** 用户事件 */
        handlePlay(idx) {
            if (this.currentIdx === idx) {
                return
            }
            this.currentIdx = idx
        },

        /** helpers */
        async getVideoLink() {
            const videoList = await this.getList(this.categoryCode)
            // 展示最新视频，缓存原来视频，删除移除的视频
            const sorted = videoList.reduce((acc, { contentid: id }) => {
                if (this.cacheIds.has(id)) {
                    const t = this.videos.find((video) => video.id === id)
                    acc.push(t)
                } else {
                    acc.push({
                        id,
                        url: '',
                    })
                }
                return acc
            }, [])
            this.videos = sorted
            videoList.forEach(({ contentid }, idx) =>
                this.getVideos(contentid, sorted[idx])
            )
        },

        goBackCrossroad() {
            this.$router.push('/user/crossroad')
        },

        loopPlay() {
            this.$refs.mp4.onended = () => {
                let next = this.currentIdx + 1
                next = next === this.videos.length ? 0 : next
                this.currentIdx = next
            }
        },
        replay() {
            const mp4 = this.$refs.mp4
            if (mp4.networkState === 3) {
                return
            }
            mp4.play()
        },

        /** 接口调用 */
        // 1. 视频列表
        async getList(CATEGORYCODE) {
            const params = {
                rows: 10 * 1000,
                page: 1,
                CATEGORYCODE,
            }
            const { rows } = await newsCall(params)
            return rows
        },
        // 2. 视频连接
        async getVideos(ID, videoInfo) {
            if (this.cacheIds.has(ID)) {
                return
            }
            const params = { ID }
            const {
                obj: { MOBILE_LINK },
            } = await newsDetailsCall(params)
            videoInfo.url = MOBILE_LINK
            this.cacheIds.add(ID)
        },
    },
}
</script>

<style scoped lang="less">
.user-video {
    padding: 0 40px;
    position: relative;

    .video-list {
        width: 300px;
        margin-right: 40px;
        height: 100%;

        .list {
            height: calc(100% - 175px);
            overflow-y: auto;

            .cell {
                width: 88%;
                height: 135px;
                object-fit: fill;

                & + .cell {
                    margin-top: 20px;
                }
            }
        }
    }

    .video {
        height: 100%;
        flex: auto;
        width: 0;
    }
}
</style>
