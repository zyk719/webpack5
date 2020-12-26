<template>
    <div class="e-sign">
        <div style="margin-bottom: 50px">
            <AioBtn width="200" height="85" @click="clear" :cancel="true"
                >重写</AioBtn
            >
            <AioBtn width="200" height="85" @click="commit">确定</AioBtn>
        </div>
        <canvas
            width="900"
            height="350"
            ref="eSign"
            @touchstart.prevent="touchStart"
            @touchmove.prevent="touchMove"
            @touchend.prevent="touchEnd"
            @mousedown.prevent="mouseDown"
            @mousemove.prevent="mouseMove"
            @mouseup.prevent="mouseUp"
            @mouseleave.prevent="mouseLeave"
        />
    </div>
</template>
<script>
import AioBtn from '@/views/components/AioBtn'

function copyTouch(touch) {
    const target = touch.target
    const {
        offsetLeft,
        offsetTop,
        offsetWidth,
        offsetHeight,
    } = target.offsetParent
    const left = target.offsetLeft + offsetLeft - offsetWidth / 2
    const top = target.offsetTop + offsetTop - offsetHeight / 2
    return {
        identifier: touch.identifier,
        pageX: touch.pageX - left,
        pageY: touch.pageY - top,
    }
}

export default {
    name: 'ESign',
    components: { AioBtn },
    props: {
        lineWidth: {
            type: String,
            default: '6',
        },
    },
    data() {
        return {
            emptySize: 0,
            canvasTxt: null,
            start: {
                x: 0,
                y: 0,
            },
            // 鼠标签字：需要摁住鼠标左键
            isDown: false,
            ongoingTouches: [],
        }
    },
    mounted() {
        this.init()
    },
    methods: {
        /** helpers */
        async init() {
            this.canvasTxt = this.$refs.eSign.getContext('2d')
            this.canvasTxt.lineWidth = this.lineWidth
            this.emptySize = await this.getSize()
        },
        getSize() {
            return new Promise((resolve) =>
                this.$refs.eSign.toBlob((blob) => resolve(blob.size))
            )
        },
        draw(start, end) {
            console.log(start, end)
            this.canvasTxt.beginPath()
            this.canvasTxt.moveTo(start.x, start.y)
            this.canvasTxt.lineTo(end.x, end.y)
            this.canvasTxt.stroke()
            this.canvasTxt.closePath()
        },
        downloadSignImg() {
            this.$refs.eSign.toBlob((blob) => {
                let url = window.URL.createObjectURL(blob)
                let link = document.createElement('a')
                link.style.display = 'none'
                link.href = url
                link.setAttribute('download', 'sign.png')
                document.body.appendChild(link).click()
                URL.revokeObjectURL(link.href)
                document.body.removeChild(link)
            })
        },
        getBlob() {
            return new Promise((resolve) =>
                this.$refs.eSign.toBlob((blob) => resolve(blob))
            )
        },

        /** 触摸屏签名 */
        touchStart(evt) {
            const touches = evt.changedTouches

            for (let i = 0; i < touches.length; i++) {
                this.ongoingTouches.push(copyTouch(touches[i]))
            }
        },
        touchMove(evt) {
            const touches = evt.changedTouches

            for (let i = 0; i < touches.length; i++) {
                const target = touches[i].target
                const {
                    offsetLeft,
                    offsetTop,
                    offsetWidth,
                    offsetHeight,
                } = target.offsetParent
                const left = target.offsetLeft + offsetLeft - offsetWidth / 2
                const top = target.offsetTop + offsetTop - offsetHeight / 2

                const idx = this.ongoingTouchIndexById(touches[i].identifier)
                if (idx >= 0) {
                    const start = {
                        x: this.ongoingTouches[idx].pageX,
                        y: this.ongoingTouches[idx].pageY,
                    }
                    const end = {
                        x: touches[i].pageX - left,
                        y: touches[i].pageY - top,
                    }
                    this.draw(start, end)

                    this.ongoingTouches.splice(idx, 1, copyTouch(touches[i]))
                } else {
                    console.log('无法确定下一个触摸点。')
                }
            }
        },
        touchEnd(evt) {
            const touches = evt.changedTouches

            for (let i = 0; i < touches.length; i++) {
                const idx = this.ongoingTouchIndexById(touches[i].identifier)

                if (idx >= 0) {
                    const start = {
                        x: this.ongoingTouches[idx].pageX,
                        y: this.ongoingTouches[idx].pageY,
                    }
                    const end = {
                        x: touches[i].offsetX,
                        y: touches[i].offsetY,
                    }
                    this.draw(start, end)
                    this.ongoingTouches.splice(idx, 1)
                } else {
                    console.log('无法确定要结束哪个触摸点。')
                }
            }
        },

        handleCancel(evt) {
            console.log('触摸取消。')
            const touches = evt.changedTouches

            for (let i = 0; i < touches.length; i++) {
                const idx = this.ongoingTouchIndexById(touches[i].identifier)
                this.ongoingTouches.splice(idx, 1) // 用完后移除
            }
        },

        ongoingTouchIndexById(idToFind) {
            for (let i = 0; i < this.ongoingTouches.length; i++) {
                const id = this.ongoingTouches[i].identifier

                if (id === idToFind) {
                    return i
                }
            }
            return -1
        },

        /** 鼠标签名 */
        mouseLeave() {
            this.isDown = false
        },
        mouseDown(evt) {
            const { offsetX: x, offsetY: y } = evt
            const start = { x, y }
            this.start = start
            this.draw(start, start)

            this.isDown = true
        },
        mouseMove({ offsetX: x, offsetY: y }) {
            if (!this.isDown) {
                return
            }

            const relay = { x, y }
            this.draw(this.start, relay)
            this.start = relay
        },
        mouseUp({ offsetX: x, offsetY: y }) {
            if (!this.isDown) {
                return
            }
            this.isDown = false

            const end = { x, y }
            this.draw(this.start, end)
        },

        /** 交互事件 */
        // 清空
        clear() {
            this.canvasTxt.clearRect(
                0,
                0,
                this.$refs.eSign.width,
                this.$refs.eSign.height
            )
        },
        // 提交签名
        async commit() {
            let url = ''
            const size = await this.getSize()
            if (size > this.emptySize) {
                url = this.$refs.eSign.toDataURL()
            }
            this.$emit('finish', url)
        },
    },
}
</script>
<style scoped lang="less">
.e-sign {
    width: 1020px;
    text-align: center;
    padding: 60px;
    background-color: #d8edf2;

    canvas {
        border: 2px solid #e3e3e3;
        border-radius: 2px;
        background-color: #fff;
    }
}
</style>
