<template>
  <Spin :loading="loading">
    <div class="blog-post-detail-container">
      <Card class="post-card">
        <div class="post-header">
          <h1 class="post-title">{{ post?.title }}</h1>
          <div class="post-author-info">
            <div class="author-details">
              <a-avatar
                :size="48"
                class="author-avatar clickable"
                @click="goToUserProfile(post?.author)"
              >
                <img v-if="authorProfile?.avatar" :src="getAvatarUrl(authorProfile.avatar)" :alt="post?.author" />
                <template v-else-if="post?.author">{{ post.author.charAt(0).toUpperCase() }}</template>
              </a-avatar>
              <div class="author-text">
                <div
                  class="author-name clickable"
                  @click="goToUserProfile(post?.author)"
                >
                  {{ post?.author }}
                </div>
                <div class="post-time">
                  <icon-clock-circle />
                  <span>{{ formatDateTime(post?.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div v-if="showFollowButton" class="follow-section">
              <a-button
                :type="isFollowing ? undefined : 'primary'"
                :status="isFollowing ? 'danger' : undefined"
                @click="toggleFollow"
                :loading="followLoading"
              >
                <template #icon>
                  <icon-star-fill />
                </template>
                {{ isFollowing ? '取消关注' : '关注' }}
              </a-button>
            </div>
          </div>
          <div class="post-meta">
            <div v-if="post?.viewCount !== undefined" class="meta-item">
              <icon-eye />
              <span>浏览: {{ post.viewCount }}</span>
            </div>
            <div v-if="post?.likeCount !== undefined" class="meta-item">
              <icon-star />
              <span>点赞: {{ post.likeCount }}</span>
            </div>
            <div v-if="post?.commentCount !== undefined" class="meta-item">
              <icon-message />
              <span>评论: {{ post.commentCount }}</span>
            </div>
            <div v-if="post?.collectCount !== undefined" class="meta-item">
              <icon-star-fill />
              <span>收藏: {{ post.collectCount }}</span>
            </div>
          </div>
        </div>

        <div
          class="post-content markdown-body"
          v-html="renderedContent"
        />

        <div v-if="post?.tags && post.tags.length > 0" class="post-tags">
          <a-tag v-for="tag in post.tags" :key="tag" class="tag-item" color="gray">
            {{ tag }}
          </a-tag>
        </div>

        <div class="post-footer">
          <div class="action-buttons">
            <a-button
              :type="isLiked ? undefined : 'default'"
              :status="isLiked ? 'danger' : undefined"
              @click="handleLike"
            >
              <template #icon>
                <icon-thumb-up />
              </template>
              点赞 {{ post?.likeCount }}
            </a-button>
            <a-button
              :type="isCollected ? undefined : 'default'"
              :status="isCollected ? 'warning' : undefined"
              @click="handleCollect"
            >
              <template #icon>
                <icon-star-fill />
              </template>
              收藏 {{ post?.collectCount }}
            </a-button>
            <a-button @click="handleShare">
              <template #icon>
                <icon-share-alt />
              </template>
              分享
            </a-button>
            <a-button @click="scrollToComments">
              <template #icon>
                <icon-message />
              </template>
              评论 {{ post?.commentCount }}
            </a-button>
            <a-button status="success" @click="openSummaryDialog">
              <template #icon>
                <icon-robot />
              </template>
              AI 摘要
            </a-button>
          </div>
          <div v-if="canEdit" class="post-actions">
            <a-button type="primary" @click="editPost">
              <template #icon>
                <icon-edit />
              </template>
              编辑
            </a-button>
            <a-button status="danger" @click="deletePost">
              <template #icon>
                <icon-delete />
              </template>
              删除
            </a-button>
          </div>
        </div>
      </Card>

      <div v-if="showComments">
        <Card class="comments-section">
          <div class="comments-header">
            <h3>评论 ({{ post?.commentCount || 0 }})</h3>
          </div>

          <div v-if="showCommentForm && isAuthenticated">
            <CommentForm
              ref="commentFormRef"
              :post-id="postId"
              :on-submit="handleCommentSubmit"
              :on-cancel="() => setShowCommentForm(false)"
            />
          </div>
          <div v-if="!showCommentForm && isAuthenticated">
            <a-button
              type="primary"
              size="large"
              @click="setShowCommentForm(true)"
            >
              <template #icon>
                <icon-edit />
              </template>
              写评论
            </a-button>
          </div>
          <div v-if="!isAuthenticated">
            <a-button
              type="primary"
              size="large"
              @click="router.push('/login')"
            >
              <template #icon>
                <icon-edit />
              </template>
              登录后评论
            </a-button>
          </div>

          <CommentList
            ref="commentListRef"
            :post-id="postId"
            :on-update-total="handleCommentCountUpdate"
          />
        </Card>
      </div>

      <LlmSummaryPostDialog
        ref="summaryDialogRef"
        :title="post?.title || ''"
        :content="post?.content || ''"
      />
    </div>
  </Spin>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marked } from 'marked';
import { Card, vatar, Button, Tag, Message, Modal, Skeleton, Spin } from '@arco-design/web-vue';
import {
  IconClockCircle,
  IconEye,
  IconStar,
  IconStarFill,
  IconMessage,
  IconShareAlt,
  IconThumbUp,
  IconEdit,
  IconDelete,
  IconRobot,
} from '@arco-design/web-vue/es/icon';
import * as postApi from '@/api/post/post';
import * as userProfileApi from '@/api/user/userProfile';
import * as userFollowApi from '@/api/user/userFollow';
import * as userPostCollectApi from '@/api/post/userPostCollect';
import { getAvatarUrl } from '@/utils/file';
import type { PostVO } from '@/models/vo/post';
import type { UserProfileVO } from '@/models/vo/user';
import CommentForm from '@/components/post/CommentForm.vue';
import CommentList from '@/components/post/CommentList.vue';
import LlmSummaryPostDialog from '@/components/llm/LlmSummaryPostDialog.vue';
import { useUserStore } from '@/stores/user';
import './PostDetail.css';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const postId = computed(() => Number(route.params.id));
const loading = ref(true);
const post = ref<PostVO | null>(null);
const isLiked = ref(false);
const isCollected = ref(false);
const canEdit = ref(false);
const showComments = ref(true);
const showCommentForm = ref(false);
const authorProfile = ref<UserProfileVO | null>(null);
const authorUserId = ref<number | null>(null);
const isFollowing = ref(false);
const followLoading = ref(false);
const showFollowButton = ref(false);

const commentListRef = ref<InstanceType<typeof CommentList> | null>(null);
const summaryDialogRef = ref<InstanceType<typeof LlmSummaryPostDialog> | null>(null);
const commentFormRef = ref<InstanceType<typeof CommentForm> | null>(null);

const isAuthenticated = computed(() => userStore.isAuthenticated);

const renderedContent = computed(() => {
  return marked.parse(post.value?.content || '') as string;
});

const checkCanManagePost = (postData: PostVO | null) => {
  if (!postData || !isAuthenticated.value || !userStore.userInfo) {
    return false;
  }
  const isOwner = postData.userId === userStore.userInfo.id;
  return isOwner || userStore.isAdmin || userStore.isModerator;
};

const checkLikeStatus = async () => {
  if (!post.value) return;
  try {
    const response = await postApi.checkLikeStatus(post.value.id);
    if (response.code === 200) {
      isLiked.value = response.data;
    } else {
      isLiked.value = false;
    }
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    isLiked.value = false;
  }
};

const checkCollectStatus = async () => {
  if (!post.value) return;
  try {
    const response = await userPostCollectApi.checkCollectStatus(post.value.id);
    if (response.code === 200) {
      isCollected.value = response.data;
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    isCollected.value = false;
  }
};

const checkFollowingStatus = async (userId: number) => {
  if (!isAuthenticated.value) {
    showFollowButton.value = false;
    return;
  }
  if (userStore.userInfo?.id === userId) {
    showFollowButton.value = false;
    return;
  }
  try {
    const response = await userFollowApi.isFollowing(userId);
    if (response.code === 200) {
      isFollowing.value = response.data;
      showFollowButton.value = true;
    }
  } catch (error) {
    console.error('检查关注状态失败:', error);
    showFollowButton.value = false;
  }
};

const loadAuthorInfo = async (userId: number) => {
  try {
    authorUserId.value = userId;
    const profileResponse = await userProfileApi.getUserProfileByUserId(userId);
    if (profileResponse.code === 200) {
      authorProfile.value = profileResponse.data;
      await checkFollowingStatus(userId);
    }
  } catch (error) {
    console.error('加载作者信息失败:', error);
  }
};

const loadPost = async () => {
  if (!postId.value) {
    Message.error('文章ID不存在');
    return;
  }
  try {
    const response = await postApi.getPostById(postId.value);
    if (response.code === 200) {
      post.value = response.data;
      if (response.data.userId) {
        await loadAuthorInfo(response.data.userId);
      }
      if (isAuthenticated.value) {
        await checkCollectStatus();
      }
      if (isAuthenticated.value) {
        await checkLikeStatus();
      }
      canEdit.value = checkCanManagePost(response.data);
    } else {
      Message.error(response.message || '获取文章失败');
    }
  } catch (error) {
    console.error('获取文章失败:', error);
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

const toggleFollow = async () => {
  if (!authorUserId.value) return;
  followLoading.value = true;
  try {
    const response = isFollowing.value
      ? await userFollowApi.unfollowUser(authorUserId.value)
      : await userFollowApi.followUser(authorUserId.value);
    if (response && response.code === 200 && response.data) {
      isFollowing.value = !isFollowing.value;
      Message.success(isFollowing.value ? '已取消关注' : '关注成功');
    } else {
      Message.error(response?.message || (isFollowing.value ? '取消关注失败' : '关注失败'));
    }
  } catch (error) {
    console.error('关注操作失败:', error);
    Message.error('操作失败');
  } finally {
    followLoading.value = false;
  }
};

const goToUserProfile = (username: string | undefined) => {
  if (!username) return;
  if (authorUserId.value) {
    router.push(`/user/${authorUserId.value}`);
  } else {
    Message.error('用户信息加载中');
  }
};

const handleLike = async () => {
  if (!isAuthenticated.value) {
    Message.warning('请先登录后再点赞');
    router.push('/login');
    return;
  }
  if (!post.value) return;
  try {
    if (isLiked.value) {
      const response = await postApi.unlikePost(post.value.id);
      if (response.code === 200) {
        isLiked.value = false;
        if (post.value) {
          post.value = {
            ...post.value,
            likeCount: Math.max(0, (post.value.likeCount || 0) - 1),
          };
        }
        Message.info('已取消点赞');
      } else {
        Message.error(response.message || '取消点赞失败');
      }
    } else {
      const response = await postApi.likePost(post.value.id);
      if (response.code === 200) {
        isLiked.value = true;
        if (post.value) {
          post.value = {
            ...post.value,
            likeCount: (post.value.likeCount || 0) + 1,
          };
        }
        Message.success('点赞成功');
      } else {
        Message.error(response.message || '点赞失败');
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    Message.error('操作失败');
  }
};

const handleCollect = async () => {
  if (!isAuthenticated.value) {
    Message.warning('请先登录后再收藏');
    router.push('/login');
    return;
  }
  if (!post.value) return;
  try {
    if (isCollected.value) {
      const response = await userPostCollectApi.cancelCollectPost(post.value.id);
      if (response.code === 200) {
        isCollected.value = false;
        if (post.value) {
          post.value = {
            ...post.value,
            collectCount: Math.max(0, (post.value.collectCount || 0) - 1),
          };
        }
        Message.info('已取消收藏');
      } else {
        Message.error(response.message || '取消收藏失败');
      }
    } else {
      const response = await userPostCollectApi.collectPost(post.value.id);
      if (response.code === 200) {
        isCollected.value = true;
        if (post.value) {
          post.value = {
            ...post.value,
            collectCount: (post.value.collectCount || 0) + 1,
          };
        }
        Message.success('收藏成功');
      } else {
        Message.error(response.message || '收藏失败');
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    Message.error('操作失败');
  }
};

const handleShare = () => {
  if (!post.value) return;
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({
      title: post.value.title,
      text: post.value.title,
      url: url,
    });
  } else {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        Message.success('链接已复制到剪贴板');
      })
      .catch(() => {
        Modal.info({
          title: '分享文章',
          content: `复制以下链接分享:\n${url}`,
          okText: '确定',
        });
      });
  }
};

const handleCommentSubmit = () => {
  showCommentForm.value = false;
  commentListRef.value?.refresh();
  if (post.value) {
    post.value = {
      ...post.value,
      commentCount: (post.value.commentCount || 0) + 1,
    };
  }
};

const handleCommentCountUpdate = (count: number) => {
  if (post.value) {
    post.value = { ...post.value, commentCount: count };
  }
};

const scrollToComments = () => {
  const commentsEl = document.querySelector('.comments-section');
  if (commentsEl) {
    commentsEl.scrollIntoView({ behavior: 'smooth' });
  }
};

const editPost = () => {
  if (post.value) {
    router.push(`/post/${post.value.id}/edit`);
  }
};

const deletePost = async () => {
  try {
    await Modal.confirm({
      title: '危险操作',
      content: '确定要删除这篇文章吗？此操作不可恢复！',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await postApi.deletePost(postId.value);
          if (response.code === 200) {
            Message.success('文章已删除');
            router.push('/post/list');
          } else {
            Message.error(response.message || '删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          Message.error('删除失败');
        }
      },
    });
  } catch {
    // User cancelled
  }
};

const formatDateTime = (str?: string) => str ? new Date(str).toLocaleString('zh-CN') : '';

const openSummaryDialog = () => {
  summaryDialogRef.value?.open();
};
</script>
