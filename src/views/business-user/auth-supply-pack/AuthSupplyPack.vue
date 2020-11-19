<template>
    <div>
        <UserAuthTitle>外包装申请</UserAuthTitle>
        <div style="text-align: center;">
            <AioBtn :cancel="true" @click="$router.push('/user/crossroad')">
                返回首页
            </AioBtn>
            <AioBtn :loading="true">完成</AioBtn>
        </div>
    </div>
</template>

<script>
import UserAuthTitle from '@/views/components/UserAuthTitle'
import AioBtn from '@/views/components/AioBtn'

export default {
    name: 'AuthSupplyPack',
    components: { UserAuthTitle, AioBtn },
}
</script>

<style scoped lang="less"></style>
