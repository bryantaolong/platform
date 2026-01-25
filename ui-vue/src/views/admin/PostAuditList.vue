<template>
  <div class="post-audit-list">
    <el-card class="header-card">
      <div class="header-content">
        <div class="title-section">
          <h2>博文审核</h2>
          <p class="subtitle">待审核的博文列表</p>
        </div>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="postList" style="width: 100%" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="title" label="标题" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="post-title">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="150" align="center" />
        <el-table-column prop="createdAt" label="提交时间" width="200" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" :icon="Check" @click="handleAudit(row)">
              去审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { postApi } from '@/api/post'
import { PostStatusEnum } from '@/models/enum/PostStatusEnum'
import type { PostVO } from '@/models/vo/post/PostVO'
import { dayjs } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const postList = ref<PostVO[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const loadAuditPosts = async () => {
  loading.value = true
  try {
    const res = await postApi.searchPostsAdmin(
      {
        title: '',
        author: '',
        tags: '',
        status: PostStatusEnum.AUDITING
      },
      pageNum.value,
      pageSize.value
    )
    if (res.code === 200) {
      postList.value = res.data.rows
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '加载待审核列表失败')
    }
  } catch (error) {
    console.error('Load audit posts error:', error)
    ElMessage.error('加载待审核列表失败')
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadAuditPosts()
}

const handleCurrentChange = (val: number) => {
  pageNum.value = val
  loadAuditPosts()
}

const handleAudit = (row: PostVO) => {
  router.push(`/post/${row.id}/audit`)
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadAuditPosts()
})
</script>

<style scoped>
.post-audit-list {
  padding: 0;
}

.header-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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

.table-card {
  border-radius: 12px;
}

.post-title {
  font-weight: 500;
  color: #303133;
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
</style>
