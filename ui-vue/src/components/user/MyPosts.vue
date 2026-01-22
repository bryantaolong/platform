<template>
  <div class="tab-content-container">
    <div class="filter-bar">
      <el-select v-model="statusFilter" placeholder="筛选状态" @change="handleStatusChange" clearable>
        <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
        />
      </el-select>
    </div>
    <el-empty v-if="posts.length === 0" description="暂无文章"/>
    <div v-else class="posts-grid">
      <el-card
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          @click="post.id && goToPostDetail(post.id)"
      >
        <h3 class="post-title">{{ post.title }}</h3>
        <div class="post-meta">
          <span class="post-date">{{ formatDate(post.createdAt) }}</span>
          <span class="post-stats">
            <el-icon><View/></el-icon> {{ post.viewCount || 0 }}
            <el-icon><ChatLineRound/></el-icon> {{ post.commentCount || 0 }}
            <el-icon><Star/></el-icon> {{ post.likeCount || 0 }}
          </span>
        </div>
        <div class="post-tags" v-if="post.tags && post.tags.length">
          <el-tag v-for="tag in post.tags" :key="tag" size="small" type="info" class="tag">
            {{ tag }}
          </el-tag>
        </div>
      </el-card>
    </div>

    <div class="pagination-wrapper" v-if="totalPosts > pageSize">
      <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalPosts"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {View, ChatLineRound, Star} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router'
import {useUserStore} from '@/stores/user.ts'
import {postApi} from '@/api/post.ts'
import type {PostVO} from '@/models/vo/post/PostVO'
import {PostStatusEnum} from '@/models/enum/PostStatusEnum.ts'

const router = useRouter()
const userStore = useUserStore()

const posts = ref<PostVO[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalPosts = ref(0)
const statusFilter = ref('')

const statusOptions = [
  { label: '全部', value: '' },
  { label: '已发布', value: PostStatusEnum.PUBLISHED },
  { label: '草稿', value: PostStatusEnum.DRAFT },
  { label: '私密', value: PostStatusEnum.PRIVATE },
  { label: '审核中', value: PostStatusEnum.AUDITING },
  { label: '已回收', value: PostStatusEnum.RECYCLED }
]

const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('zh-CN') : ''

const loadPosts = async () => {
  if (!userStore.userInfo?.id) return
  const res = await postApi.getPostVOsByUserId(userStore.userInfo.id, currentPage.value, pageSize.value)
  if (res.code === 200) {
    let filteredPosts = res.data.rows
    if (statusFilter.value) {
      filteredPosts = filteredPosts.filter(post => post.status === statusFilter.value)
    }
    posts.value = filteredPosts as PostVO[]
    totalPosts.value = filteredPosts.length
  }
}

const handleStatusChange = () => {
  currentPage.value = 1
  loadPosts()
}

const handleSizeChange = (s: number) => {
  pageSize.value = s
  loadPosts()
}

const handleCurrentChange = (p: number) => {
  currentPage.value = p
  loadPosts()
}

const goToPostDetail = (id: number) => router.push(`/post/${id}`)

defineExpose({
  loadPosts,
  postCount: totalPosts
})

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.tab-content-container {
  padding: 20px 0;
}

.filter-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.post-card {
  cursor: pointer;
  transition: 0.3s;
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  height: 44px;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.post-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.post-tags {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  margin: 0;
}

.pagination-wrapper {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
</style>
