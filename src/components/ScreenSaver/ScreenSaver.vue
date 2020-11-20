<template>
    <div
        class="screen-saver flex-center"
        v-show="$store.state.screenSaver"
        @click="$store.commit('toggleScreenSaver', false)"
    >
        <video
            muted
            autoplay
            ref="mp4"
            class="video"
            :src="(videos[currentIdx] || {}).url || ''"
        ></video>
    </div>
</template>

<script>
import { newsCall, newsDetailsCall } from '@/api/bussiness/news'

export default {
    name: 'ScreenSaver',
    data() {
        return {
            count: 0,
            videos: [],
            cacheIds: new Set(),
            categoryCode: 'cat01_05',
            currentIdx: 0,
        }
    },
    mounted() {
        this.loopPlay()
        this.getVideoLink()
    },
    watch: {
        '$store.state.screenSaver'(nV) {
            if (!nV) {
                this.$refs.mp4.pause()
                return
            }

            if (this.count > 0) {
                this.$refs.mp4.muted = false
                this.$refs.mp4.play()

                this.getVideoLink()
            }

            this.count += 1
        },
    },
    methods: {
        /** helpers */
        loopPlay() {
            this.$refs.mp4.onended = () => {
                let next = this.currentIdx + 1
                next = next === this.videos.length ? 0 : next
                this.currentIdx = next
            }
        },
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
.screen-saver {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background-color: rgba(0, 0, 0);

    .video {
        width: 100%;
        height: 100%;
    }
}
</style>
