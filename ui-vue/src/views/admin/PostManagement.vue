<template>
  <div class="post-management">
    <el-card class="header-card">
      <div class="header-content">
        <div class="title-section">
          <h2>博文管理</h2>
          <p class="subtitle">管理系统所有博文内容</p>
        </div>
      </div>
    </el-card>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="博文标题" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="searchForm.author" placeholder="作者名" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="已发布" :value="PostStatusEnum.PUBLISHED" />
            <el-option label="审核中" :value="PostStatusEnum.AUDITING" />
            <el-option label="草稿" :value="PostStatusEnum.DRAFT" />
            <el-option label="私有" :value="PostStatusEnum.PRIVATE" />
            <el-option label="回收站" :value="PostStatusEnum.RECYCLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="postList" style="width: 100%" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="120" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="阅读" width="80" align="center" />
        <el-table-column prop="likeCount" label="点赞" width="80" align="center" />
        <el-table-column prop="createdAt" label="发布时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" type="primary" :icon="Edit" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button
                v-if="row.status === PostStatusEnum.AUDITING"
                size="small"
                type="success"
                :icon="Check"
                @click="handleAudit(row)"
              >
                审核
              </el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Edit, Delete, Check } from '@element-plus/icons-vue'
import * as postApi from '@/api/post/post.ts'
import { PostStatusEnum } from '@/models/enum/PostStatusEnum'
import type { PostVO } from '@/models/vo/post/PostVO'
import { dayjs } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const postList = ref<PostVO[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  title: '',
  author: '',
  status: null as PostStatusEnum | null
})

const loadPosts = async () => {
  loading.value = true
  try {
    const res = await postApi.queryPosts(
      {
        title: searchForm.title,
        author: searchForm.author,
        tags: '',
        status: searchForm.status ?? undefined
      },
      pageNum.value,
      pageSize.value
    )
    if (res.code === 200) {
      postList.value = res.data.rows
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '加载博文列表失败')
    }
  } catch (error) {
    console.error('Load posts error:', error)
    ElMessage.error('加载博文列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  loadPosts()
}

const handleReset = () => {
  searchForm.title = ''
  searchForm.author = ''
  searchForm.status = null
  pageNum.value = 1
  loadPosts()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadPosts()
}

const handleCurrentChange = (val: number) => {
  pageNum.value = val
  loadPosts()
}

const handleView = (row: PostVO) => {
  router.push(`/post/${row.id}`)
}

const handleEdit = (row: PostVO) => {
  router.push(`/post/${row.id}/edit`)
}

const handleAudit = (row: PostVO) => {
  router.push(`/post/${row.id}/audit`)
}

const handleDelete = async (row: PostVO) => {
  try {
    await ElMessageBox.confirm(`确定要删除博文 "${row.title}" 吗？此操作不可恢复！`, '警告', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await postApi.deletePost(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadPosts()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    // Cancel
  }
}

const getStatusType = (status: PostStatusEnum) => {
  switch (status) {
    case PostStatusEnum.PUBLISHED: return 'success'
    case PostStatusEnum.AUDITING: return 'warning'
    case PostStatusEnum.DRAFT: return 'info'
    case PostStatusEnum.PRIVATE: return 'danger'
    case PostStatusEnum.RECYCLED: return 'danger'
    default: return ''
  }
}

const getStatusLabel = (status: PostStatusEnum) => {
  switch (status) {
    case PostStatusEnum.PUBLISHED: return '已发布'
    case PostStatusEnum.AUDITING: return '审核中'
    case PostStatusEnum.DRAFT: return '草稿'
    case PostStatusEnum.PRIVATE: return '私有'
    case PostStatusEnum.RECYCLED: return '回收站'
    default: return status
  }
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.post-management {
  padding: 0;
}

.header-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.table-card {
  border-radius: 12px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header) {
  background-color: #f5f7fa;
}
</style>
