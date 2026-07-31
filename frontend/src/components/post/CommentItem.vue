<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Avatar, Tag, Button, Modal, Message } from '@arco-design/web-vue';
import { IconMessage, IconArrowUp, IconStar, IconDelete } from '@arco-design/web-vue/es/icon';
import CommentForm from './CommentForm.vue';
import * as commentApi from '@/api/post/postComment';
import { getAvatarUrl } from '@/utils/file';
import type { CommentVO } from '@/models/vo/post';

interface Props {
  comment: CommentVO;
  isReply?: boolean;
}

const emit = defineEmits<{
  (e: 'reply', commentId: number): void;
  (e: 'like', commentId: number): void;
  (e: 'delete', commentId: number): void;
}>();

const props = withDefaults(defineProps<Props>(), {
  isReply: false,
});

const showReplyForm = ref(false);
const isLiked = ref(false);
const canDelete = false;

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

onMounted(async () => {
  const checkLikeStatus = async () => {
    try {
      const response = await commentApi.checkLikeStatus(props.comment.id);
      if (response.code === 200) {
        isLiked.value = response.data;
      }
    } catch (error) {
      console.error('检查点赞状态失败:', error);
    }
  };

  await checkLikeStatus();
});

const handleReply = () => {
  showReplyForm.value = !showReplyForm.value;
  emit('reply', props.comment.id);
};

const handleReplySubmit = () => {
  showReplyForm.value = false;
  emit('reply', props.comment.id);
};

const handleLike = async () => {
  try {
    if (isLiked.value) {
      const response = await commentApi.unlikeComment(props.comment.id);
      if (response.code === 200) {
        isLiked.value = false;
        props.comment.likeCount = Math.max(0, (props.comment.likeCount || 0) - 1);
        Message.info('已取消点赞');
        emit('like', props.comment.id);
      } else {
        Message.error(response.message || '取消点赞失败');
      }
    } else {
      const response = await commentApi.likeComment(props.comment.id);
      if (response.code === 200) {
        isLiked.value = true;
        props.comment.likeCount = (props.comment.likeCount || 0) + 1;
        Message.success('点赞成功');
        emit('like', props.comment.id);
      } else {
        Message.error(response.message || '点赞失败');
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    Message.error('操作失败');
  }
};

const handleDelete = () => {
  Modal.confirm({
    title: '删除评论',
    content: '确定要删除这条评论吗？此操作不可恢复！',
    onOk: async () => {
      try {
        const response = await commentApi.deleteComment(props.comment.id);
        if (response.code === 200) {
          Message.success('评论已删除');
          emit('delete', props.comment.id);
        } else {
          Message.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除评论失败:', error);
        Message.error('删除失败');
      }
    },
  });
};

const loadMoreReplies = async () => {
  try {
    const response = await commentApi.listRepliesByCommentId(props.comment.id);
    if (response.code === 200 && response.data) {
      if (!props.comment.replies) {
        props.comment.replies = [];
      }
      props.comment.replies.push(...response.data);
    }
  } catch (error) {
    console.error('加载更多回复失败:', error);
    Message.error('加载失败');
  }
};
</script>

<template>
  <div :className="'comment-item' + (isReply ? ' is-reply' : '')">
    <div className="comment-header">
      <Avatar :size="isReply ? 32 : 40">
        <img :src="getAvatarUrl(comment.avatar)" alt="" />
        {{ comment.username ? comment.username.charAt(0).toUpperCase() : '' }}
      </Avatar>

      <div className="comment-user-info">
        <div className="comment-author">
          {{ comment.username }}
          <Tag v-if="comment.floor != null" size="small" className="floor-tag">
            #{{ comment.floor }}
          </Tag>
        </div>
        <div className="comment-time">{{ formatDateTime(comment.createdAt) }}</div>
      </div>
    </div>

    <div className="comment-content">
      <div v-if="comment.replyToUsername" className="reply-to">
        回复 <span className="reply-to-user">@{{ comment.replyToUsername }}</span>
      </div>
      <div className="content-text">{{ comment.content }}</div>
    </div>

    <div className="comment-actions">
      <Button
        size="small"
        type="text"
        @click="handleReply"
      >
        <IconMessage />
        回复
      </Button>
      <Button
        size="small"
        type="text"
        @click="handleLike"
      >
        <IconStar v-if="isLiked" />
        <IconArrowUp v-else />
        {{ comment.likeCount || 0 }}
      </Button>
      <Button
        v-if="canDelete"
        size="small"
        type="text"
        status="danger"
        @click="handleDelete"
      >
        <IconDelete />
        删除
      </Button>
    </div>

    <div v-if="showReplyForm" className="reply-form-container">
      <CommentForm
        :post-id="comment.postId"
        :parent-id="comment.id"
        :reply-to-user-id="comment.userId"
        :reply-to-username="comment.username"
        @submit="handleReplySubmit"
        @cancel="() => showReplyForm = false"
      />
    </div>

    <div v-if="comment.replies && comment.replies.length > 0" className="replies-container">
      <div v-if="comment.childCount != null && comment.childCount > comment.replies.length" className="replies-header">
        <Button type="text" size="small" @click="loadMoreReplies">
          查看更多回复 ({{ comment.childCount - comment.replies.length }})
        </Button>
      </div>
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :is-reply="true"
        @reply="$emit('reply', $event)"
        @like="$emit('like', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  /* same styles as original */
}
</style>
