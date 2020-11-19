<template>
    <img
        :src="src"
        alt="randNum"
        @click="createRandUrl"
        style="cursor: pointer;"
    />
</template>

<script>
import { randImage } from '@/api/app/user'

export default {
    name: 'RandNum',
    data() {
        return {
            src: '',
        }
    },
    created() {
        this.createRandUrl()
    },
    methods: {
        createRandUrl() {
            randImage().then(img => (this.src = img))
        },
    },
}
</script>
