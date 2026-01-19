<template>
  <div class="tab-content-container">
    <div class="filter-bar">
      <el-select
        v-model="selectedCollectionValue"
        placeholder="选择收藏夹"
        @change="handleCollectionChange"
        clearable
      >
        <el-option label="全部收藏" value="all" />
        <el-option :label="'默认收藏夹'" :value="0" />
        <el-option
          v-for="collection in collections"
          :key="collection.id"
          :label="collection.folderName"
          :value="collection.id"
        />
        <el-option
          v-if="enableCreate"
          label="新建收藏夹..."
          value="__create__"
        />
      </el-select>
    </div>
    
    <el-empty v-if="collects.length === 0" description="暂无收藏" />

    <div v-else class="posts-grid">
      <el-card
        v-for="collect in collects"
        :key="collect.id"
        class="post-card"
        @click="goToPostDetail(collect.postId)"
      >
        <h3 class="post-title">{{ collect.postTitle }}</h3>
        <div class="post-meta">
          <span class="post-date">收藏于 {{ formatDate(collect.createdAt) }}</span>
        </div>
      </el-card>
    </div>

    <div class="pagination-wrapper" v-if="totalCollects > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalCollects"
        layout="total, prev, pager, next"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      v-model="showCreateDialog"
      title="新建收藏夹"
      width="400px"
      destroy-on-close
    >
      <el-form @submit.prevent>
        <el-form-item label="收藏夹名称">
          <el-input v-model="newFolderName" placeholder="请输入收藏夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreateCollection">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userPostCollectApi } from '@/api/userPostCollect.ts'
import { userPostCollectionApi, type UserPostCollection } from '@/api/userPostCollection.ts'

/**
 * UserCollectList 组件
 *
 * 用于展示指定用户的收藏列表，支持按收藏夹筛选；只有在 isOwner = true 时可以创建新收藏夹。
 */
interface UserPostCollectItem {
  id: number
  postId: number
  postTitle: string
  createdAt?: string
}

interface Props {
  /** 要展示收藏的用户 ID */
  userId?: number
  /** 是否当前登录用户自己的主页 */
  isOwner?: boolean
}

const props = defineProps<Props>()

const router = useRouter()

const collections = ref<UserPostCollection[]>([])
const collects = ref<UserPostCollectItem[]>([])
const totalCollects = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 'all' 表示全部收藏，0 表示默认收藏夹，其它为具体收藏夹 ID
const selectedCollectionValue = ref<string | number>('all')

const showCreateDialog = ref(false)
const newFolderName = ref('')
const creating = ref(false)

const formatDate = (dateStr?: string) =>
  dateStr ? new Date(dateStr).toLocaleDateString('zh-CN') : ''

const isOwner = computed(() => props.isOwner ?? true)
const enableCreate = computed(() => isOwner.value)

const getSelectedCollectionId = (): number | undefined => {
  const value = selectedCollectionValue.value
  if (value === 'all') return undefined
  if (typeof value === 'number') return value
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

// 加载用户的收藏夹列表（根据 isOwner 决定调用哪个接口）
const loadCollections = async () => {
  if (!props.userId && !isOwner.value) return

  const res = isOwner.value
    ? await userPostCollectionApi.getCollections()
    : await userPostCollectionApi.getCollectionsByUser(props.userId as number)

  if (res.code === 200 && Array.isArray(res.data)) {
    collections.value = res.data
  }
}

// 加载用户的收藏列表（根据 isOwner 决定调用哪个接口）
const loadCollects = async () => {
  const collectionId = getSelectedCollectionId()

  const res = isOwner.value
    ? await userPostCollectApi.getUserCollects(
        currentPage.value,
        pageSize.value,
        collectionId
      )
    : await userPostCollectApi.getUserCollectsByUser(
        props.userId as number,
        currentPage.value,
        pageSize.value,
        collectionId
      )

  if (res.code === 200) {
    collects.value = res.data.rows as UserPostCollectItem[]
    totalCollects.value = res.data.total
  }
}

const handleCollectionChange = (value: string | number | null) => {
  if (value === '__create__') {
    // 触发创建收藏夹
    selectedCollectionValue.value = 'all'
    showCreateDialog.value = true
    return
  }

  // 选择其他收藏夹时，从第一页重新加载
  currentPage.value = 1
  selectedCollectionValue.value = value ?? 'all'
  loadCollects()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadCollects()
}

const handleCreateCollection = async () => {
  const name = newFolderName.value.trim()
  if (!name) {
    ElMessage.warning('请输入收藏夹名称')
    return
  }

  creating.value = true
  try {
    const res = await userPostCollectionApi.createCollection(name)
    if (res.code === 200 && res.data) {
      ElMessage.success('创建收藏夹成功')
      showCreateDialog.value = false
      newFolderName.value = ''

      // 重新加载收藏夹列表并选中新建的收藏夹
      await loadCollections()
      selectedCollectionValue.value = res.data.id
      currentPage.value = 1
      await loadCollects()
    } else {
      ElMessage.error(res.message || '创建收藏夹失败')
    }
  } catch (error) {
    ElMessage.error('创建收藏夹失败')
  } finally {
    creating.value = false
  }
}

const goToPostDetail = (postId: number) => {
  router.push(`/post/${postId}`)
}

onMounted(async () => {
  await loadCollections()
  await loadCollects()
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

.pagination-wrapper {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
</style>
