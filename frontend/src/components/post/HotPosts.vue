<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Skeleton, Empty, Select } from '@arco-design/web-vue';
import { IconFire, IconSun, IconEye, IconMessage, IconStar } from '@arco-design/web-vue/es/icon';
import type { PostVO } from '@/types';
import * as postHotRankApi from '@/api/post/postHotRank.ts';

const router = useRouter();

const hotPosts = ref<PostVO[]>([]);
const loading = ref(true);
const limit = ref(10);

const loadHotPosts = async (newLimit?: number) => {
  loading.value = true;
  try {
    const res = await postHotRankApi.listHotPosts(newLimit || limit.value);
    if (res.code === 200 && res.data) {
      hotPosts.value = res.data as PostVO[];
    }
  } catch (error) {
    console.error('获取热门文章失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadHotPosts();
});

const getRankClass = (index: number): string => {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return '';
};

const formatHotScore = (score?: number): string => {
  if (!score) return '0';
  if (score >= 1000) return (score / 1000).toFixed(1) + 'k';
  return score.toFixed(0);
};

const handleLimitChange = (value: number) => {
  limit.value = value;
  loadHotPosts(value);
};

const goToPostDetail = (id: number) => {
  router.push(`/post/${id}`);
};
</script>

<template>
  <div className="hot-posts-container">
    <div className="section-header">
      <h3 className="section-title">
        <IconFire />
        热门文章
      </h3>
      <Select
        :value="limit"
        @change="handleLimitChange"
        size="small"
        :style="{ width: 90 }"
      >
        <Select.Option :value="5">Top 5</Select.Option>
        <Select.Option :value="10">Top 10</Select.Option>
        <Select.Option :value="20">Top 20</Select.Option>
      </Select>
    </div>

    <Skeleton v-if="loading" animation />

    <Empty v-if="!loading && hotPosts.length === 0" description="暂无热门文章" />

    <div v-if="!loading && hotPosts.length > 0" className="hot-posts-list">
      <div
        v-for="(post, index) in hotPosts"
        :key="post.id"
        className="hot-post-item"
        @click="post.id && goToPostDetail(post.id)"
      >
        <span :className="'rank-number ' + getRankClass(index)">
          {{ index + 1 }}
        </span>
        <div className="hot-post-content">
          <h4 className="hot-post-title">{{ post.title }}</h4>
          <div className="hot-post-meta">
            <span className="hot-score">
              <IconSun />
              {{ formatHotScore(post.hotScore) }}
            </span>
            <span className="hot-stats">
              <IconEye /> {{ post.viewCount || 0 }}
              <IconMessage /> {{ post.commentCount || 0 }}
              <IconStar /> {{ post.likeCount || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hot-posts-container {
  /* same styles as original */
}
</style>
