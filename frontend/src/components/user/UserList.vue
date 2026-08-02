<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Card, vatar, Empty } from '@arco-design/web-vue';
import { getAvatarUrl } from '@/utils/file';
import type { UserProfileVO } from '@/types';

interface Props {
  users: UserProfileVO[];
  onClose: () => void;
}

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const props = withDefaults(defineProps<Props>(), {});

const router = useRouter();

const goToUserProfile = (userId: number) => {
  router.push(`/user/${userId}`);
  emit('close');
};
</script>

<template>
  <Empty v-if="users.length === 0" description="暂无用户" />
  <div v-else className="user-list">
    <div className="users-grid">
      <Card
        v-for="user in users"
        :key="user.userId"
        className="user-card"
        hoverable
        @click="goToUserProfile(user.userId)"
      >
        <div className="user-info">
          <Avatar :size="40">
            <img :src="getAvatarUrl(user.avatar)" alt="" />
            {{ user.username?.charAt(0).toUpperCase() }}
          </Avatar>
          <div className="user-text">
            <div className="user-name">{{ user.username }}</div>
            <div v-if="user.realName" className="user-real-name">{{ user.realName }}</div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
