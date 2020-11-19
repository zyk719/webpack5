<template>
    <div id="app" :style="`transform: scale(${scale.x}, ${scale.y});`">
        <router-view />
    </div>
</template>

<script>
function suitScale(scale) {
    const newScale = {
        x: (window.innerWidth / 1920).toFixed(20),
        y: (window.innerHeight / 1080).toFixed(20),
    }
    Object.assign(scale, newScale)
}

export default {
    name: 'App',
    data() {
        return {
            scale: {
                x: 1,
                y: 1,
            },
        }
    },
    created() {
        suitScale(this.scale)
    },
    mounted() {
        window.onresize = suitScale.bind(this, this.scale)
    },
}
</script>

<style lang="less">
@import '~normalize.css';
@import '~nprogress/nprogress.css';
@import './main.less';

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

// ui size
#app {
    width: 1920px;
    height: 1080px;
    transform-origin: top left;
}
</style>
