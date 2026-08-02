<script setup lang="ts">
import { ref, onMounted, defineExpose } from 'vue';
import { Radio, Button, Empty, Spin } from '@arco-design/web-vue';
import { IconMessage, IconArrowUp, IconStar, IconDelete } from '@arco-design/web-vue/es/icon';
import * as commentApi from '@/api/post/postComment';
import type { CommentVO } from '@/types';
import CommentItem from './CommentItem.vue';

interface Props {
  postId: number;
  pageSize?: number;
  onUpdateTotal?: (count: number) => void;
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
});

const emit = defineEmits<{
  (e: 'update:total', count: number): void;
}>();

const activeTab = ref<'all' | 'hot' | 'latest'>('all');
const loading = ref(false);
const comments = ref<CommentVO[]>([]);
const totalCount = ref(0);
const hasMore = ref(false);

const loadComments = async (_reset = true) => {
  if (loading.value) return;

  loading.value = true;
  try {
    let response;
    let count = 0;

    if (activeTab.value === 'all') {
      response = await commentApi.getCommentTree(props.postId);
      if (response.code === 200) {
        const data = response.data || [];
        comments.value = data;
        count = data.length;
        totalCount.value = count;
        hasMore.value = false;
      }
    } else if (activeTab.value === 'hot') {
      response = await commentApi.listHotComments(props.postId, props.pageSize!);
      if (response.code === 200) {
        const data = response.data || [];
        comments.value = data;
        count = data.length;
        totalCount.value = count;
        hasMore.value = false;
      }
    } else if (activeTab.value === 'latest') {
      response = await commentApi.listLatestComments(props.postId, props.pageSize!);
      if (response.code === 200) {
        const data = response.data || [];
        comments.value = data;
        count = data.length;
        totalCount.value = count;
        hasMore.value = false;
      }
    }

    props.onUpdateTotal?.(count);
  } catch (error) {
    console.error('加载评论失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (props.postId) {
    loadComments(true);
  }
});

defineExpose({
  refresh: () => {
    loadComments(true);
  },
});

const handleTabChange = (value: string) => {
  activeTab.value = value as 'all' | 'hot' | 'latest';
  loadComments(true);
};
</script>

<template>
  <div className="comment-list-container">
    <div className="comment-tabs">
      <Radio.Group type="button" :value="activeTab" @change="handleTabChange">
        <Radio value="all">全部评论 ({{ totalCount }})</Radio>
        <Radio value="hot">热评</Radio>
        <Radio value="latest">最新</Radio>
      </Radio.Group>
    </div>

    <Spin :loading="loading" className="comments-content">
      <template #default>
        <template v-if="comments.length === 0 && !loading">
          <Empty description="暂无评论，快来抢沙发吧~" />
        </template>
        <template v-else>
          <CommentItem
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            @reply="(_commentId) => {
              // Handle reply - could emit to parent via a callback prop
            }"
            @like="async (commentId) => {
              try {
                const res = await commentApi.likeComment(commentId);
                if (res.code === 200) {
                  loadComments();
                }
              } catch (error) {
                console.error('点赞失败:', error);
              }
            }"
            @delete="async (commentId) => {
              try {
                const res = await commentApi.deleteComment(commentId);
                if (res.code === 200) {
                  loadComments();
                }
              } catch (error) {
                console.error('删除评论失败:', error);
              }
            }"
          />
        </template>

        <div v-if="hasMore && !loading" className="load-more">
          <Button type="text" @click="() => {}">
            加载更多评论
          </Button>
        </div>
      </template>
    </Spin>
  </div>
</template>

<style scoped>
.comment-list-container {
  /* same styles as original */
}
</style>
