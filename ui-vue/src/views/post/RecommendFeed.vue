<template>
  <div class="recommend-feed-page">
    <PersonalizedFeed ref="feedRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PersonalizedFeed from '@/components/post/PersonalizedFeed.vue'

const feedRef = ref<InstanceType<typeof PersonalizedFeed> | null>(null)

// 暴露刷新方法给父组件
defineExpose({
  refreshFeed: () => feedRef.value?.refresh()
})
</script>

<style scoped>
.recommend-feed-page {
  width: 100%;
}
</style>
