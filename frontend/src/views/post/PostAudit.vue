<template>
  <div class="blog-post-detail-container">
    <Card class="post-card" style="margin-bottom: 20">
      <div class="post-header">
        <span class="post-title" style="font-size: 18">
          博文审核
        </span>
        <a-tag :color="currentTag.color" size="large">
          {{ currentTag.label }}
        </a-tag>
      </div>

      <div v-if="post?.status === PostStatusEnum.AUDITING" style="margin-top: 16">
        <a-form>
          <a-form-item label="审核意见">
            <a-textarea
              v-model="auditReason"
              :rows="3"
              placeholder="选填，驳回时请填写原因"
            />
          </a-form-item>
          <a-form-item>
            <a-button
              type="primary"
              status="success"
              @click="handleAudit(PostStatusEnum.PUBLISHED)"
              style="margin-right: 12"
            >
              <template #icon>
                <icon-thumb-up />
              </template>
              通过
            </a-button>
            <a-button
              type="primary"
              status="danger"
              @click="handleAudit(PostStatusEnum.RECYCLED)"
            >
              <template #icon>
                <icon-star />
              </template>
              驳回
            </a-button>
          </a-form-item>
        </a-form>
      </div>
      <div v-else>
        <a-button @click="router.back()" style="margin-top: 16">
          返回列表
        </a-button>
      </div>
    </Card>

    <Card class="post-card">
      <a-skeleton v-if="loading" animation :text="{ rows: 6 }" />
      <template v-else-if="post">
        <div class="post-header">
          <h1 class="post-title">{{ post.title }}</h1>
          <div class="post-meta">
            <div class="meta-item">
              <icon-user />
              <span>{{ post.author }}</span>
            </div>
            <div class="meta-item">
              <icon-clock-circle />
              <span>{{ formatDateTime(post.createdAt) }}</span>
            </div>
            <div v-if="post.viewCount !== undefined" class="meta-item">
              <icon-eye />
              <span>浏览: {{ post.viewCount }}</span>
            </div>
            <div v-if="post.likeCount !== undefined" class="meta-item">
              <icon-thumb-up />
              <span>点赞: {{ post.likeCount }}</span>
            </div>
            <div v-if="post.commentCount !== undefined" class="meta-item">
              <icon-message />
              <span>评论: {{ post.commentCount }}</span>
            </div>
            <div v-if="post.collectCount !== undefined" class="meta-item">
              <icon-star />
              <span>收藏: {{ post.collectCount }}</span>
            </div>
          </div>
        </div>

        <div class="post-content-wrapper">
          <div class="markdown-viewer">
            <div class="source-pane">
              <div class="pane-title">源码</div>
              <pre class="source-code">{{ post.content }}</pre>
            </div>
            <div class="preview-pane">
              <div class="pane-title">预览</div>
              <div
                class="markdown-body"
                v-html="renderedContent"
              />
            </div>
          </div>
        </div>

        <div v-if="post.tags && post.tags.length > 0" class="post-tags">
          <a-tag v-for="tag in post.tags" :key="tag" class="tag-item" color="gray">
            {{ tag }}
          </a-tag>
        </div>
      </template>
      <div v-else class="post-empty">
        文章不存在
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marked } from 'marked';
import { Card, Form, Input, Button, Tag, Message, Modal, Skeleton } from '@arco-design/web-vue';
import {
  IconUser,
  IconClockCircle,
  IconEye,
  IconThumbUp,
  IconMessage,
  IconStar,
} from '@arco-design/web-vue/es/icon';
import * as postApi from '@/api/post/post';
import type { PostVO, PostStatusEnum } from '@/types';
import './PostAudit.css';

interface TagConfig {
  label: string;
  color: string;
}

const tagMap: Record<string, TagConfig> = {
  [PostStatusEnum.PUBLISHED]: { label: '已发布', color: 'green' },
  [PostStatusEnum.DRAFT]: { label: '草稿', color: 'gray' },
  [PostStatusEnum.PRIVATE]: { label: '仅自己可见', color: 'orange' },
  [PostStatusEnum.AUDITING]: { label: '审核中', color: 'blue' },
  [PostStatusEnum.RECYCLED]: { label: '回收站', color: 'red' },
};

const router = useRouter();
const route = useRoute();
const postId = computed(() => Number(route.params.id));
const loading = ref(true);
const post = ref<PostVO | null>(null);
const auditReason = ref('');

const renderedContent = computed(() => {
  return marked.parse(post.value?.content || '') as string;
});

const currentTag = computed(() => {
  return tagMap[post.value?.status || PostStatusEnum.AUDITING];
});

const loadPost = async () => {
  if (!postId.value) {
    Message.error('文章ID不存在');
    return;
  }
  try {
    const res = await postApi.getPostById(postId.value);
    if (res.code === 200) {
      post.value = res.data as PostVO;
    } else {
      Message.error(res.message || '获取文章失败');
    }
  } catch (e) {
    Message.error('获取文章失败');
  } finally {
    loading.value = false;
  }
};

watch(postId, (newId) => {
  if (newId) {
    loadPost();
  }
});

onMounted(() => {
  loadPost();
});

const handleAudit = async (status: PostStatusEnum) => {
  if (status === PostStatusEnum.RECYCLED && !auditReason.value.trim()) {
    Message.warning('请填写驳回原因');
    return;
  }
  const isPublish = status === PostStatusEnum.PUBLISHED;
  Modal.confirm({
    title: '提示',
    content: isPublish ? '确认通过该博文？' : '确认驳回该博文？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await postApi.updatePostStatus(postId.value, status);
        if (res.code === 200) {
          Message.success(isPublish ? '已通过' : '已驳回');
          loadPost();
        } else {
          Message.error(res.message || '操作失败');
        }
      } catch (e) {
        Message.error('操作失败');
      }
    },
  });
};

const formatDateTime = (str?: string) => str ? new Date(str).toLocaleString('zh-CN') : '';
</script>
