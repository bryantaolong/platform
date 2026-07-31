<template>
  <div class="following-posts-page">
    <div class="post-list-container">
      <a-skeleton v-if="loading" animation />
      <div v-if="!loading && posts.length === 0">
        <a-empty description="还没有关注任何用户，或关注的用户暂无动态" />
        <div style="text-align: center; margin-top: 16">
          <a-button type="primary" @click="goToExplore">
            去发现
          </a-button>
        </div>
      </div>
      <div v-if="!loading && posts.length > 0">
        <div class="post-list">
          <a-card
            v-for="post in posts"
            :key="post.id"
            class="post-card"
            hoverable
            @click="viewPost(post.id)"
          >
            <div class="post-card-header">
              <span class="author-name">{{ post.author }}</span>
              <span class="post-date">
                {{ formatDateTime(post.createdAt) }}
              </span>
            </div>
            <div class="post-content">
              <h3 class="post-title">{{ post.title }}</h3>
              <div
                class="post-summary"
                v-html="renderMarkdown(post.contentPreview)"
              />
            </div>
            <div class="post-footer">
              <div class="stats">
                <span class="stat-item">
                  <icon-eye /> {{ post.viewCount }}
                </span>
                <span class="stat-item">
                  <icon-star /> {{ post.likeCount }}
                </span>
                <span class="stat-item">
                  <icon-message /> {{ post.commentCount }}
                </span>
              </div>
              <div v-if="post.tags && post.tags.length > 0" class="tags">
                <a-tag v-for="tag in post.tags" :key="tag" size="small" color="gray">
                  {{ tag }}
                </a-tag>
              </div>
            </div>
          </a-card>
        </div>

        <div class="pagination-wrapper">
          <a-pagination
            :current="pagination.currentPage"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            :size-options="[10, 20, 50]"
            show-total
            show-jumper
            @change="handleCurrentChange"
            @page-size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { marked } from 'marked';
import { Card, Skeleton, Empty, Button, Pagination, Tag, Message } from '@arco-design/web-vue';
import {
  IconEye,
  IconStar,
  IconMessage,
} from '@arco-design/web-vue/es/icon';
import * as postApi from '@/api/post/post';
import type { PostSummaryVO } from '@/models/vo/post/PostSummaryVO';
import './FollowingPosts.css';

interface PaginationData {
  currentPage: number;
  pageSize: number;
  total: number;
}

const router = useRouter();
const loading = ref(true);
const posts = ref<PostSummaryVO[]>([]);
const pagination = ref<PaginationData>({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

const loadPosts = async () => {
  loading.value = true;
  try {
    const response = await postApi.listFollowedUsersPosts(
      pagination.value.currentPage,
      pagination.value.pageSize
    );
    if (response.code === 200) {
      posts.value = response.data.rows;
      pagination.value = { ...pagination.value, total: response.data.total };
    } else {
      Message.error(response.message || '加载关注文章失败');
    }
  } catch (error) {
    console.error('加载关注文章失败:', error);
    Message.error('加载关注文章失败');
  } finally {
    loading.value = false;
  }
};

watch(
  () => [pagination.value.currentPage, pagination.value.pageSize],
  () => {
    loadPosts();
  }
);

onMounted(() => {
  loadPosts();
});

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const renderMarkdown = (text: string): string => {
  if (!text) return '';
  return marked.parse(text) as string;
};

const handleSizeChange = (size: number) => {
  pagination.value = { ...pagination.value, pageSize: size, currentPage: 1 };
};

const handleCurrentChange = (page: number) => {
  pagination.value = { ...pagination.value, currentPage: page };
};

const viewPost = (postId: number) => {
  router.push(`/post/${postId}`);
};

const goToExplore = () => {
  router.push('/');
};
</script>
