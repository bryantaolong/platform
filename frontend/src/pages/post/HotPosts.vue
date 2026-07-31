<template>
  <div class="hot-posts-page">
    <div class="page-header">
      <h1 class="page-title">
        <icon-fire />
        热门文章
      </h1>
      <p class="page-subtitle">发现最受欢迎的精彩内容</p>
    </div>

    <div class="hot-content">
      <div class="hot-content-row">
        <div class="hot-main">
          <div class="hot-list-container">
            <a-skeleton v-if="loading" animation :text="{ width: ['80%', '60%', '90%', '70%', '50%'] }" />
            <a-empty v-else-if="hotPosts.length === 0" description="暂无热门文章" />
            <div v-else class="hot-list">
              <div
                v-for="(post, index) in hotPosts"
                :key="post.id"
                class="hot-post-card"
                @click="viewPost(post.id)"
              >
                <div :class="['rank-badge', getRankClass(index)]">
                  {{ index + 1 }}
                </div>
                <div class="post-content">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <div
                    class="post-preview markdown-preview"
                    v-html="renderMarkdown(getContentPreview(post.content))"
                  />
                  <div class="post-meta">
                    <div class="meta-left">
                      <span class="meta-item">
                        <icon-eye /> {{ post.viewCount || 0 }}
                      </span>
                      <span class="meta-item">
                        <icon-message /> {{ post.commentCount || 0 }}
                      </span>
                      <span class="meta-item">
                        <icon-star /> {{ post.likeCount || 0 }}
                      </span>
                      <span class="meta-item">
                        <icon-thumb-up /> {{ post.collectCount || 0 }}
                      </span>
                    </div>
                    <div class="meta-right">
                      <span class="hot-score">
                        <icon-sun />
                        热度 {{ formatHotScore(post.hotScore) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <Card class="hot-rank-card">
            <div class="card-header">
              <span>TOP 5</span>
            </div>
            <div class="top-list">
              <div
                v-for="(post, index) in topPosts"
                :key="index"
                class="top-item"
                @click="viewPost(post.id)"
              >
                <span :class="['top-rank', getRankClass(index)]">
                  {{ index + 1 }}
                </span>
                <span class="top-title">{{ post.title }}</span>
                <span class="top-score">
                  {{ formatHotScore(post.hotScore) }}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { marked } from 'marked';
import { Message, Card, Empty, Skeleton } from '@arco-design/web-vue';
import {
  IconFire,
  IconEye,
  IconMessage,
  IconStar,
  IconThumbUp,
  IconSun,
} from '@arco-design/web-vue/es/icon';
import type { PostVO } from '@/models/vo/post';
import * as postHotRankApi from '@/api/post/postHotRank';
import './HotPosts.css';

const router = useRouter();
const loading = ref(true);
const hotPosts = ref<PostVO[]>([]);

const topPosts = computed(() => hotPosts.value.slice(0, 5));

const loadHotPosts = async () => {
  loading.value = true;
  try {
    const res = await postHotRankApi.listHotPosts(20);
    if (res.code === 200 && res.data) {
      hotPosts.value = res.data as PostVO[];
    } else {
      Message.error(res.message || '获取热门文章失败');
    }
  } catch (error) {
    console.error('获取热门文章失败:', error);
    Message.error('获取热门文章失败');
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
  if (score >= 10000) return (score / 10000).toFixed(1) + 'w';
  if (score >= 1000) return (score / 1000).toFixed(1) + 'k';
  return score.toFixed(0);
};

const getContentPreview = (content?: string): string => {
  if (!content) return '';
  return content.length > 100 ? content.substring(0, 100) + '...' : content;
};

const renderMarkdown = (text: string): string => {
  if (!text) return '';
  return marked.parse(text) as string;
};

const viewPost = (postId?: number) => {
  if (postId) {
    router.push(`/post/${postId}`);
  }
};
</script>
