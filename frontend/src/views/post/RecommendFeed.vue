<template>
  <div class="recommend-feed-page">
    <PersonalizedFeed :refresh-ref="feedRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PersonalizedFeed from '@/components/post/PersonalizedFeed.vue';
import './RecommendFeed.css';

const feedRef = ref<(() => void) | null>(null);
</script>
