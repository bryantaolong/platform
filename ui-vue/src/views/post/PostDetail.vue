<template>
  <div class="blog-post-detail-container" v-loading="loading">
    <el-card class="post-card">
      <template #header>
        <div class="post-header">
          <h1 class="post-title">{{ post?.title }}</h1>
          <div class="post-author-info">
            <div class="author-details">
              <el-avatar
                  :size="48"
                  :src="authorProfile?.avatar"
                  class="author-avatar clickable"
                  @click="goToUserProfile(post?.author)"
              >
                {{ post?.author ? post?.author.charAt(0).toUpperCase() : '' }}
              </el-avatar>
              <div class="author-text">
                <div class="author-name clickable" @click="goToUserProfile(post?.author)">
                  {{ post?.author }}
                </div>
                <div class="post-time">
                  <el-icon><Clock/></el-icon>
                  <span>{{ formatDateTime(post?.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="follow-section" v-if="showFollowButton">
              <el-button
                  :type="isFollowing ? 'danger' : 'primary'"
                  :icon="Star"
                  @click="toggleFollow"
                  :loading="followLoading"
              >
                {{ isFollowing ? '取消关注' : '关注' }}
              </el-button>
            </div>
          </div>
          <div class="post-meta">
            <div class="meta-item" v-if="post?.viewCount !== undefined">
              <el-icon>
                <View/>
              </el-icon>
              <span>浏览: {{ post?.viewCount }}</span>
            </div>
            <div class="meta-item" v-if="post?.likeCount !== undefined">
              <el-icon>
                <Star/>
              </el-icon>
              <span>点赞: {{ post?.likeCount }}</span>
            </div>
            <div class="meta-item" v-if="post?.commentCount !== undefined">
              <el-icon>
                <ChatLineRound/>
              </el-icon>
              <span>评论: {{ post?.commentCount }}</span>
            </div>
            <div class="meta-item" v-if="post?.collectCount !== undefined">
              <el-icon>
                <Collection/>
              </el-icon>
              <span>收藏: {{ post?.collectCount }}</span>
            </div>
          </div>
        </div>
      </template>

      <div class="post-content markdown-body" v-html="renderedContent"></div>

      <!-- 约 91 行 -->
      <div class="post-tags" v-if="post?.tags && post?.tags.length">
        <el-tag
            v-for="tag in post.tags"
            :key="tag"
            class="tag-item"
            type="info"
            size="small"
        >
          {{ tag }}
        </el-tag>
      </div>

      <div class="post-footer">
        <el-button-group class="action-buttons">
          <el-button
              :icon="ArrowUpBold"
              :type="isLiked ? 'danger' : 'default'"
              @click="handleLike"
          >
            点赞 {{ post?.likeCount }}
          </el-button>
          <el-button
              :icon="Collection"
              :type="isCollected ? 'warning' : 'default'"
              @click="handleCollect"
          >
            收藏 {{ post?.collectCount }}
          </el-button>
          <el-button
              :icon="Share"
              @click="handleShare"
          >
            分享
          </el-button>
          <el-button
              :icon="ChatLineRound"
              @click="scrollToComments"
          >
            评论 {{ post?.commentCount }}
          </el-button>
          <el-button
              :icon="MagicStick"
              type="success"
              @click="openSummaryDialog"
          >
            AI 摘要
          </el-button>
        </el-button-group>

        <div class="post-actions" v-if="canEdit">
          <el-button
              type="primary"
              :icon="Edit"
              @click="editPost"
          >
            编辑
          </el-button>
          <el-button
              type="danger"
              :icon="Delete"
              @click="deletePost"
          >
            删除
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Comments Section -->
    <el-card class="comments-section" v-if="showComments">
      <template #header>
        <div class="comments-header">
          <h3>评论 ({{ post?.commentCount || 0 }})</h3>
        </div>
      </template>

      <!-- Add Comment Form -->
      <CommentForm
          v-if="showCommentForm && isAuthenticated"
          :post-id="postId"
          @submit="handleCommentSubmit"
          @cancel="showCommentForm = false"
      />

      <el-button
          v-if="!showCommentForm && isAuthenticated"
          type="primary"
          size="large"
          :icon="Edit"
          @click="showCommentForm = true"
          class="write-comment-btn"
      >
        写评论
      </el-button>

      <el-button
          v-if="!isAuthenticated"
          type="primary"
          size="large"
          :icon="Edit"
          @click="router.push('/login')"
          class="write-comment-btn"
      >
        登录后评论
      </el-button>

      <!-- Comments List -->
      <CommentList
          ref="commentListRef"
          :post-id="postId"
          @update:total="handleCommentCountUpdate"
      />
    </el-card>

    <!-- AI Summary Dialog -->
    <LlmSummaryPostDialog
        ref="summaryDialogRef"
        :title="post?.title || ''"
        :content="post?.content || ''"
    />
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import {ref, onMounted, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {
  Clock,
  View,
  Star,
  ChatLineRound,
  Collection,
  Share,
  ArrowUpBold,
  Edit,
  Delete,
  MagicStick
} from '@element-plus/icons-vue'
import { postApi } from '@/api/post'
import { userApi } from '@/api/user'
import { userFollowApi } from '@/api/userFollow'
import type { PostVO } from "@/models/vo/post/PostVO";
import type { UserProfileVO } from '@/models/vo/user/UserProfileVO'
import {userPostCollectApi} from "@/api/userPostCollect.ts";
import CommentForm from '@/components/post/CommentForm.vue'
import CommentList from '@/components/post/CommentList.vue'
import LlmSummaryPostDialog from '@/components/llm/LlmSummaryPostDialog.vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const postId = ref(Number(route.params.id))
const loading = ref(true)
const post = ref<PostVO | null>(null)
const isLiked = ref(false)
const isCollected = ref(false)
const canEdit = ref(false)
const showComments = ref(true)
const showCommentForm = ref(false)
const commentListRef = ref()
const authorProfile = ref<UserProfileVO | null>(null)
const authorUserId = ref<number | null>(null) // Cache author user ID
const isFollowing = ref(false)
const followLoading = ref(false)
const showFollowButton = ref(false)
const summaryDialogRef = ref<InstanceType<typeof LlmSummaryPostDialog> | null>(null)

const isAuthenticated = computed(() => userStore.isAuthenticated)

// Computed property for rendered markdown content
const renderedContent = computed(() => {
  return marked.parse(post.value?.content || '')
})

// Load post data
const loadPost = async () => {
  if (!postId.value) {
    ElMessage.error('文章ID不存在')
    return
  }

  try {
    const response = await postApi.getPostById(postId.value)
    if (response.code === 200) {
      post.value = response.data

      // Load author profile and stats
      if (post.value.userId) {
        await loadAuthorInfo(post.value.userId)
      }

      // Check collect status (only for authenticated users)
      if (isAuthenticated.value) {
        await checkCollectStatus()
      }

      // Check like status (only for authenticated users)
      if (isAuthenticated.value) {
        await checkLikeStatus()
      }

      // Check if current user can edit this post (only post owner)
      if (isAuthenticated.value && userStore.userInfo) {
        canEdit.value = post.value.author === userStore.userInfo.username
      } else {
        canEdit.value = false
      }
    } else {
      ElMessage.error(response.message || '获取文章失败')
    }
  } catch (error) {
    console.error('获取文章失败:', error)
    ElMessage.error('获取文章失败')
  } finally {
    loading.value = false
  }
}

// Load author information
const loadAuthorInfo = async (userId: number) => {
  try {
    // Cache the author user ID for later use (follow operations)
    authorUserId.value = userId
    
    // Get author profile directly by userId
    const profileResponse = await userApi.getUserProfileByUserId(userId)
    if (profileResponse.code === 200) {
      authorProfile.value = profileResponse.data

      // Check if current user is following this author
      await checkFollowingStatus(userId)
    }
  } catch (error) {
    console.error('加载作者信息失败:', error)
  }
}

// Check if current user is following the author
const checkFollowingStatus = async (userId: number) => {
  if (!isAuthenticated.value) {
    showFollowButton.value = false
    return
  }
  
  try {
    const response = await userFollowApi.checkFollowing(userId)
    if (response.code === 200) {
      isFollowing.value = response.data
      showFollowButton.value = true
    }
  } catch (error) {
    console.error('检查关注状态失败:', error)
    showFollowButton.value = false
  }
}

// Toggle follow/unfollow
const toggleFollow = async () => {
  if (!authorUserId.value) return

  followLoading.value = true
  try {
    const response = isFollowing.value
      ? await userFollowApi.unfollowUser(authorUserId.value)
      : await userFollowApi.followUser(authorUserId.value)

    if (response && response.code === 200 && response.data) {
      isFollowing.value = !isFollowing.value
      ElMessage.success(isFollowing.value ? '关注成功' : '已取消关注')
    } else {
      ElMessage.error(response?.message || (isFollowing.value ? '取消关注失败' : '关注失败'))
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

// Navigate to user profile
const goToUserProfile = async (username: string | undefined) => {
  if (!username) return

  // Use cached authorUserId if available
  if (authorUserId.value) {
    router.push(`/user/${authorUserId.value}`)
  } else {
    ElMessage.error('用户信息加载中')
  }
}

// Handle like action
const handleLike = async () => {
  if (!isAuthenticated.value) {
    ElMessage.warning('请先登录后再点赞')
    router.push('/login')
    return
  }

  if (!post.value) return

  try {
    if (isLiked.value) {
      const response = await postApi.unlikePost(post.value.id)
      if (response.code === 200) {
        isLiked.value = false
        post.value.likeCount = Math.max(0, (post.value.likeCount || 0) - 1)
        ElMessage.info('已取消点赞')
      } else {
        ElMessage.error(response.message || '取消点赞失败')
      }
    } else {
      const response = await postApi.likePost(post.value.id)
      if (response.code === 200) {
        isLiked.value = true
        post.value.likeCount = (post.value.likeCount || 0) + 1
        ElMessage.success('点赞成功')
      } else {
        ElMessage.error(response.message || '点赞失败')
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// Check like status
const checkLikeStatus = async () => {
  if (!post.value) return

  try {
    const response = await postApi.checkLikeStatus(post.value.id)
    if (response.code === 200) {
      isLiked.value = response.data
    } else {
      isLiked.value = false
    }
  } catch (error) {
    console.error('检查点赞状态失败:', error)
    isLiked.value = false
  }
}

// Check collect status
const checkCollectStatus = async () => {
  if (!post.value) return

  try {
    const response = await userPostCollectApi.checkCollectStatus(post.value.id)
    if (response.code === 200) {
      isCollected.value = response.data
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error)
    isCollected.value = false
  }
}

// Handle collect action
const handleCollect = async () => {
  if (!isAuthenticated.value) {
    ElMessage.warning('请先登录后再收藏')
    router.push('/login')
    return
  }

  try {
    if (!post.value) return

    if (isCollected.value) {
      const response = await userPostCollectApi.uncollectPost(post.value.id)
      if (response.code === 200) {
        isCollected.value = false
        post.value.collectCount = Math.max(0, (post.value.collectCount || 0) - 1)
        ElMessage.info('已取消收藏')
      } else {
        ElMessage.error(response.message || '取消收藏失败')
      }
    } else {
      const response = await userPostCollectApi.collectPost(post.value.id)
      if (response.code === 200) {
        isCollected.value = true
        post.value.collectCount = (post.value.collectCount || 0) + 1
        ElMessage.success('收藏成功')
      } else {
        ElMessage.error(response.message || '收藏失败')
      }
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// Handle share action
const handleShare = () => {
  if (!post.value) return

  const url = window.location.href
  const title = `分享文章: ${post.value.title}`

  if (navigator.share) {
    navigator.share({
      title: post.value.title,
      text: post.value.title,
      url: url
    })
  } else {
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    }).catch(() => {
      ElMessageBox.alert(`复制以下链接分享:\n${url}`, '分享文章', {
        confirmButtonText: '确定'
      })
    })
  }
}

// Handle comment submit
const handleCommentSubmit = () => {
  showCommentForm.value = false
  if (commentListRef.value) {
    commentListRef.value.refresh()
  }
  if (post.value) {
    post.value.commentCount = (post.value.commentCount || 0) + 1
  }
}

// Handle comment count update
const handleCommentCountUpdate = (count: number) => {
  if (post.value) {
    post.value.commentCount = count
  }
}

// Scroll to comments section
const scrollToComments = () => {
  const commentsEl = document.querySelector('.comments-section')
  if (commentsEl) {
    commentsEl.scrollIntoView({behavior: 'smooth'})
  }
}

// Edit post
const editPost = () => {
  if (post.value) {
    router.push(`/post/${post.value.id}/edit`)
  }
}

// Delete post
const deletePost = async () => {
  try {
    await ElMessageBox.confirm(
        '确定要删除这篇文章吗？此操作不可恢复！',
        '危险操作',
        {type: 'error'}
    )

    const response = await postApi.deletePost(postId.value)
    if (response.code === 200) {
      ElMessage.success('文章已删除')
      router.push('/post/list')
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch {
  }
}

// Format datetime for display
const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// Open AI summary dialog
const openSummaryDialog = () => {
  if (summaryDialogRef.value) {
    summaryDialogRef.value.open()
  }
}

onMounted(() => {
  loadPost()
})
</script>

<style scoped>
.blog-post-detail-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 0 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 120px);
}

.post-card {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.post-header {
  margin-bottom: 20px;
}

.post-title {
  margin: 0 0 15px 0;
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.3;
}

.post-author-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.author-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  cursor: pointer;
  transition: transform 0.2s;
}

.author-avatar.clickable:hover {
  transform: scale(1.05);
}

.author-text {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  transition: color 0.2s;
}

.author-name:hover {
  color: #409eff;
}

.post-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 14px;
}

.author-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.follow-section {
  display: flex;
  align-items: center;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item .el-icon {
  font-size: 16px;
}

.post-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* Markdown Styles */
.markdown-body {
  color: #24292f;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body :deep(h1) { padding-bottom: 0.3em; border-bottom: 1px solid #eaecef; font-size: 2em; }
.markdown-body :deep(h2) { padding-bottom: 0.3em; border-bottom: 1px solid #eaecef; font-size: 1.5em; }

.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.markdown-body :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.markdown-body :deep(pre code) {
  display: inline;
  max-width: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}

.markdown-body :deep(blockquote) {
  padding: 0 1em;
  color: #656d76;
  border-left: 0.25em solid #d0d7de;
  margin: 0 0 16px 0;
}

.markdown-body :deep(ul), .markdown-body :deep(ol) {
  padding-left: 2em;
  margin-bottom: 16px;
}

.markdown-body :deep(img) {
  max-width: 100%;
  box-sizing: content-box;
}

.markdown-body :deep(table) {
  display: block;
  width: 100%;
  width: max-content;
  max-width: 100%;
  overflow: auto;
  border-spacing: 0;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #d0d7de;
}

.markdown-body :deep(table tr) {
  background-color: #ffffff;
  border-top: 1px solid #d0d7de;
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.post-tags {
  margin: 20px 0;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.post-actions {
  display: flex;
  gap: 12px;
}

.comments-section {
  border-radius: 12px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comments-header h3 {
  margin: 0;
  font-size: 18px;
}

.write-comment-btn {
  width: 100%;
  margin-bottom: 20px;
}

.comments-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>