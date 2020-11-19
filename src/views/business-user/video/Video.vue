<template>
    <div class="user-video">
        <AioBtn
            class="back-position"
            width="191"
            height="65"
            :cancel="true"
            @click="goBackCrossroad"
        >
            <Icon type="ios-undo" />
            返回
        </AioBtn>
        <div class="video">
            <span class="mask">
                <video
                    controls
                    controlslist="nodownload"
                    autoplay
                    height="100%"
                    ref="mp4"
                    :src="(videos[currentIdx] || {}).url || ''"
                />
            </span>
        </div>
        <div class="video-bar flex-ac-js">
            <div
                class="btn"
                @mousedown="handleMove(-20)"
                @mouseup="handleStopMove"
            >
                <Icon type="ios-arrow-back" />
            </div>
            <div ref="scroll" class="list">
                <video
                    class="cell"
                    v-for="(item, idx) in videos"
                    :key="item.id"
                    :src="item.url"
                    @click="handlePlay(idx)"
                />
            </div>
            <div
                class="btn"
                @mousedown="handleMove(20)"
                @mouseup="handleStopMove"
            >
                <Icon type="ios-arrow-forward" />
            </div>
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
            this.readyForMove()
            this.loopPlay()
            this.disablePicInPic()
        },

        /** 用户事件 */
        handleMove(num) {
            this.long = num
            this.touched = true
        },
        handleStopMove() {
            this.long = 0
            this.touched = false
        },
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
                    const t = this.videos.find(video => video.id === id)
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
        disablePicInPic() {
            this.$refs.mp4.disablePictureInPicture = true
        },

        goBackCrossroad() {
            this.$router.push('/user/crossroad')
        },

        readyForMove() {
            const scroll = this.$refs.scroll
            const maxScrollLeft = scroll.scrollWidth - scroll.clientWidth
            this.timeId = setInterval(() => {
                if (!this.touched) {
                    return
                }
                console.log('touched')
                const sl = scroll.scrollLeft
                const canNotLeft = sl === 0 && this.long < 0
                const canNotRight = sl === maxScrollLeft && this.long > 0
                log('canNotLeft', canNotLeft, 'canNotRight', canNotRight)
                if (canNotLeft || canNotRight) {
                    return
                }

                let r = scroll.scrollLeft + this.long
                log('can move')
                if (r <= 0) {
                    log('left end')
                    r = 0
                } else if (r >= maxScrollLeft) {
                    log('right end')
                    r = maxScrollLeft
                }

                scroll.scrollLeft = r
            }, 1000 / 60)
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
    padding: 60px 40px 0;
    position: relative;

    .back-position {
        position: absolute;
        top: 49px;
        left: 40px;
    }

    .video {
        display: block;
        height: 607px;
        margin: 0 auto;
        text-align: center;

        .mask {
            display: inline-block;
            height: 100%;
        }
    }

    .video-bar {
        margin: 60px 175px 0;
        height: 150px;

        .btn {
            width: 50px;
            height: 150px;
            background-color: rgba(57, 104, 134, 0.1);
            cursor: pointer;
            font-size: 32px;
            .flexCenter();
        }

        .list {
            flex: auto;
            width: 0;
            height: 150px;
            margin: 0 40px;
            overflow-x: auto;
            display: flex;
            align-items: center;

            .cell {
                flex: 0 0 auto;
                height: 100%;

                & + .cell {
                    margin-left: 40px;
                }

                position: relative;
            }
        }
    }
}
</style>
