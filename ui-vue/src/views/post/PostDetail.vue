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

      <div class="post-content" v-html="post?.content"></div>

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
          <h3>评论</h3>
          <el-button
              type="primary"
              size="small"
              :icon="Edit"
              @click="toggleCommentForm"
          >
            写评论
          </el-button>
        </div>
      </template>

      <!-- Add Comment Form -->
      <el-form v-if="showCommentForm" class="comment-form">
        <el-form-item>
          <el-input
              v-model="newComment"
              :rows="4"
              type="textarea"
              placeholder="请输入您的评论..."
          />
        </el-form-item>
        <el-form-item>
          <el-button
              type="primary"
              :icon="Check"
              @click="submitComment"
              :loading="submittingComment"
          >
            发表评论
          </el-button>
          <el-button @click="toggleCommentForm">
            取消
          </el-button>
        </el-form-item>
      </el-form>

      <!-- Comments List -->
      <div class="comments-list">
        <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
        >
          <div class="comment-header">
            <el-avatar :size="32" :src="comment.avatar">
              {{ comment.author ? comment.author.charAt(0).toUpperCase() : '' }}
            </el-avatar>
            <div class="comment-user-info">
              <div class="comment-author">{{ comment.author }}</div>
              <div class="comment-time">{{ formatDateTime(comment.createdAt) }}</div>
            </div>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <div class="comment-actions">
            <el-button size="small" text @click="replyToComment(comment.id)">
              回复
            </el-button>
            <el-button size="small" text @click="likeComment(comment.id)">
              <el-icon>
                <ArrowUpBold/>
              </el-icon>
              ({{ comment.likeCount || 0 }})
            </el-button>
          </div>
        </div>
      </div>

      <!-- Pagination for comments -->
      <div class="comments-pagination" v-if="totalComments > pageSize">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalComments"
            layout="prev, pager, next"
            @current-change="loadComments"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {
  User,
  Clock,
  View,
  Star,
  ChatLineRound,
  Collection,
  Share,
  ArrowUpBold,
  Edit,
  Delete,
  Check
} from '@element-plus/icons-vue'
import { postApi } from '@/api/post'
import { userApi } from '@/api/user'
import { userFollowApi } from '@/api/userFollow'
import type { PostVO } from "@/models/vo/post/PostVO";
import type { UserProfileVO } from '@/models/vo/UserProfileVO'

interface Comment {
  id: number
  author: string
  content: string
  avatar?: string
  likeCount: number
  createdAt: string
}

const route = useRoute()
const router = useRouter()
const postId = ref(Number(route.params.id))
const loading = ref(true)
const post = ref<PostVO | null>(null)
const isLiked = ref(false)
const isCollected = ref(false)
const canEdit = ref(false)
const showComments = ref(true)
const showCommentForm = ref(false)
const newComment = ref('')
const submittingComment = ref(false)
const comments = ref<Comment[]>([])
const totalComments = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const authorProfile = ref<UserProfileVO | null>(null)
const isFollowing = ref(false)
const followLoading = ref(false)
const showFollowButton = ref(false) // Only show follow button if not viewing own profile

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
      if (post.value.author) {
        await loadAuthorInfo(post.value.author)
      }

      // Check collect status
      await checkCollectStatus()

      // Check like status
      await checkLikeStatus()

      // Check if current user can edit this post
      // This would require checking the current user's ID against post.userId
      // For now, using a mock value
      canEdit.value = true // Mock value - in real implementation, check user permissions
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
const loadAuthorInfo = async (username: string) => {
  try {
    // Get author user info
    const userResponse = await userApi.getUserByUsername(username)
    if (userResponse.code === 200 && userResponse.data) {
      // Get author profile
      const profileResponse = await userApi.getUserProfileByUserId(userResponse.data.id)
      if (profileResponse.code === 200) {
        authorProfile.value = profileResponse.data

        // Check if current user is following this author
        await checkFollowingStatus(userResponse.data.id)
      }
    }
  } catch (error) {
    console.error('加载作者信息失败:', error)
  }
}

// Check if current user is following the author
const checkFollowingStatus = async (userId: number) => {
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

// Load comments
const loadComments = async () => {
  try {
    // Mock implementation for comments
    // In real implementation, we would call the API to get comments
    comments.value = [
      {
        id: 1,
        author: '张三',
        content: '这是一篇很棒的文章，感谢分享！',
        likeCount: 3,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        author: '李四',
        content: '我有一些不同的观点，想和您进一步讨论。',
        likeCount: 1,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
    totalComments.value = 2
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
  }
}

// Format datetime for display
const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// Toggle follow/unfollow
const toggleFollow = async () => {
  if (!post.value?.author) return

  followLoading.value = true
  try {
    let response
    if (isFollowing.value) {
      // Unfollow
      const userResponse = await userApi.getUserByUsername(post.value.author)
      if (userResponse.code === 200) {
        response = await userFollowApi.unfollowUser(userResponse.data.id)
      }
    } else {
      // Follow
      const userResponse = await userApi.getUserByUsername(post.value.author)
      if (userResponse.code === 200) {
        response = await userFollowApi.followUser(userResponse.data.id)
      }
    }

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

  try {
    const userResponse = await userApi.getUserByUsername(username)
    if (userResponse.code === 200) {
      router.push(`/user/${userResponse.data.id}`)
    } else {
      ElMessage.error('用户不存在')
    }
  } catch (error) {
    console.error('跳转用户页面失败:', error)
    ElMessage.error('跳转失败')
  }
}

// Handle like action
const handleLike = async () => {
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
    const response = await postApi.checkCollectStatus(post.value.id)
    if (response.code === 200) {
      isCollected.value = response.data
    }
  } catch (error) {
    console.error('检查收藏状态失败:', error)
    // Default to false if check fails
    isCollected.value = false
  }
}

// Handle collect action
const handleCollect = async () => {
  try {
    if (!post.value) return

    if (isCollected.value) {
      // Uncollect
      const response = await postApi.uncollectPost(post.value.id)
      if (response.code === 200) {
        isCollected.value = false
        post.value.collectCount = Math.max(0, (post.value.collectCount || 0) - 1)
        ElMessage.info('已取消收藏')
      } else {
        ElMessage.error(response.message || '取消收藏失败')
      }
    } else {
      // Collect
      const response = await postApi.collectPost(post.value.id)
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

  // Create shareable link
  const url = window.location.href
  const title = `分享文章: ${post.value.title}`

  // Try to use the Web Share API if available
  if (navigator.share) {
    navigator.share({
      title: post.value.title,
      text: post.value.title,
      url: url
    })
  } else {
    // Fallback: copy link to clipboard
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    }).catch(() => {
      // Fallback: show message to user
      ElMessageBox.alert(`复制以下链接分享:\n${url}`, '分享文章', {
        confirmButtonText: '确定'
      })
    })
  }
}

// Toggle comment form visibility
const toggleCommentForm = () => {
  showCommentForm.value = !showCommentForm.value
}

// Submit new comment
const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  if (!post.value) return

  submittingComment.value = true
  try {
    // Call API to submit comment
    // Mock implementation
    const newCommentObj: Partial<Comment> = {
      id: comments.value.length + 1,
      author: '当前用户', // In real implementation, get from user store
      content: newComment.value,
      likeCount: 0,
      createdAt: new Date().toISOString()
    }

    comments.value.unshift(newCommentObj as Comment)
    post.value.commentCount = (post.value.commentCount || 0) + 1
    newComment.value = ''
    showCommentForm.value = false
    ElMessage.success('评论发表成功')
  } catch (error) {
    ElMessage.error('发表评论失败')
  } finally {
    submittingComment.value = false
  }
}

// Reply to a comment
const replyToComment = (commentId: number) => {
  console.log('Reply to comment:', commentId)
  ElMessage.info('回复功能开发中...')
}

// Like a comment
const likeComment = (commentId: number) => {
  console.log('Like comment:', commentId)
  ElMessage.info('评论点赞功能开发中...')
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

    // Call API to delete post
    const response = await postApi.deletePost(postId.value)
    if (response.code === 200) {
      ElMessage.success('文章已删除')
      router.push('/post/list') // Navigate back to list
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch {
    // User canceled the operation
  }
}

onMounted(() => {
  loadPost()
  loadComments()
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

.post-content :deep(p) {
  margin-bottom: 16px;
}

.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3),
.post-content :deep(h4),
.post-content :deep(h5),
.post-content :deep(h6) {
  margin: 24px 0 12px 0;
  font-weight: bold;
}

.post-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 10px 0;
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

.comment-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #fff;
}

.comment-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-user-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.comment-author {
  font-weight: 600;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  margin-bottom: 12px;
  color: #606266;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.comments-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>