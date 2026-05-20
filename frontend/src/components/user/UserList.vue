<template>
  <div class="user-list">
    <el-empty v-if="users.length === 0" description="暂无用户" />
    <div v-else class="users-grid">
      <el-card 
        v-for="user in users" 
        :key="user.userId" 
        class="user-card"
        @click="goToUserProfile(user.userId)"
      >
        <div class="user-info">
          <el-avatar :size="40" :src="getAvatarUrl(user.avatar)">
            {{ user.username?.charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="user-text">
            <div class="user-name">{{ user.username }}</div>
            <div class="user-real-name" v-if="user.realName">
              {{ user.realName }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { getAvatarUrl } from '@/utils/file'
import type { UserProfileVO } from '@/models/vo/user'

interface Props {
  users: UserProfileVO[]
}

defineProps<Props>()
const emit = defineEmits(['close'])

const router = useRouter()

// Go to user profile
const goToUserProfile = (userId: number) => {
  router.push(`/user/${userId}`)
  emit('close')
}
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