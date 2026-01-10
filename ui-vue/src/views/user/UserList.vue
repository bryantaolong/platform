<template>
  <div class="user-list">
    <el-empty v-if="users.length === 0" description="暂无用户" />
    <div v-else class="users-grid">
      <el-card 
        v-for="user in users" 
        :key="user.id" 
        class="user-card"
        @click="goToUserProfile(user.id)"
      >
        <div class="user-info">
          <el-avatar :size="40" :src="userProfileMap[user.id]?.avatar">
            {{ user.username?.charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="user-text">
            <div class="user-name">{{ user.username }}</div>
            <div class="user-real-name" v-if="userProfileMap[user.id]?.realName">
              {{ userProfileMap[user.id]?.realName }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
    
    <div class="pagination-wrapper" v-if="totalUsers > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalUsers"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'
import type { SysUser } from '@/models/entity/SysUser'
import type { UserProfileVO } from '@/models/vo/UserProfileVO'

interface Props {
  userIds: number[]
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const router = useRouter()
const users = ref<SysUser[]>([])
const userProfileMap = ref<Record<number, UserProfileVO>>({})
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// Load users by IDs
const loadUsers = async () => {
  if (!props.userIds || props.userIds.length === 0) {
    users.value = []
    return
  }

  try {
    // For simplicity, we'll just get the first few users
    // In a real implementation, we would fetch users by IDs
    const userIdsToLoad = props.userIds.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
    const userPromises = userIdsToLoad.map(id => userApi.getUserById(id))
    
    const responses = await Promise.allSettled(userPromises)
    const loadedUsers: SysUser[] = []
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i]
      if (response.status === 'fulfilled' && response.value.code === 200) {
        loadedUsers.push(response.value.data)
      }
    }
    
    users.value = loadedUsers
    
    // Load profiles for each user
    for (const user of loadedUsers) {
      try {
        const profileResponse = await userApi.getUserProfileByUserId(user.id)
        if (profileResponse.code === 200) {
          userProfileMap.value[user.id] = profileResponse.data
        }
      } catch (error) {
        console.error(`Failed to load profile for user ${user.id}:`, error)
      }
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

// Go to user profile
const goToUserProfile = (userId: number) => {
  router.push(`/user/${userId}`)
  emit('close')
}

// Handle page size change
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadUsers()
}

// Handle current page change
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadUsers()
}

// Watch for changes in userIds prop
watch(() => props.userIds, () => {
  totalUsers.value = props.userIds.length
  loadUsers()
}, { immediate: true })

onMounted(() => {
  totalUsers.value = props.userIds.length
})
</script>

<style scoped>
.user-list {
  padding: 10px 0;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.user-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-text {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #303133;
}

.user-real-name {
  font-size: 14px;
  color: #909399;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>