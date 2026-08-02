<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Card,
  Avatar,
  Button,
  Tabs,
  TabPane,
  Empty,
  Pagination,
  Tag,
  Descriptions,
  DescriptionsItem,
  Modal,
  Message,
} from '@arco-design/web-vue';
import {
  IconStar,
  IconEye,
  IconMessage,
  IconUser,
} from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import * as userProfileApi from '@/api/user/userProfile.ts';
import * as userFollowApi from '@/api/user/userFollow.ts';
import * as userMessageApi from '@/api/user/userMessage.ts';
import * as postApi from '@/api/post/post.ts';
import { getAvatarUrl } from '@/utils/file';
import type { UserProfileVO } from '@/types';
import type { PostVO } from '@/types';
import UserList from '@/components/user/UserList.vue';
import UserCollectList from '@/components/user/UserCollectList.vue';
import './UserProfilePublic.css';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const userIdNum = computed(() => Number(route.params.userId));

const activeTab = ref('posts');
const isFollowing = ref(false);
const followLoading = ref(false);
const showFollowButton = ref(false);
const showFollowingDialog = ref(false);
const showFollowerDialog = ref(false);
const canChat = ref(false);

const userProfile = ref<UserProfileVO | null>(null);
const userStats = reactive({ followingCount: 0, followerCount: 0 });
const posts = ref<PostVO[]>([]);
const postCount = ref(0);
const totalPosts = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const followingUsers = ref<UserProfileVO[]>([]);
const followerUsers = ref<UserProfileVO[]>([]);

/* --- Data loading --- */
const loadUserStats = async () => {
  const response = await userFollowApi.getUserFollowStats(userIdNum.value);
  if (response.code === 200) {
    userStats.followingCount = response.data.followingCount;
    userStats.followerCount = response.data.followerCount;
  }
};

const checkFollowingStatus = async () => {
  if (userStore.userInfo?.id === userIdNum.value) {
    showFollowButton.value = false;
    return;
  }

  const response = await userFollowApi.isFollowing(userIdNum.value);
  if (response.code === 200) {
    isFollowing.value = response.data;
    showFollowButton.value = true;
  }

  const chatResponse = await userMessageApi.canChatWith(userIdNum.value);
  if (chatResponse.code === 200) {
    canChat.value = chatResponse.data;
  }
};

const loadUserPosts = async () => {
  const response = await postApi.listPublishedPostsByUserId(
    userIdNum.value,
    currentPage.value,
    pageSize.value
  );
  if (response.code === 200) {
    posts.value = response.data.rows;
    totalPosts.value = response.data.total;
    postCount.value = response.data.total;
  }
};

const loadUserProfile = async () => {
  try {
    const response = await userProfileApi.getUserProfileByUserId(userIdNum.value);
    if (response.code === 200) {
      userProfile.value = response.data;
      await loadUserStats();
      await checkFollowingStatus();
      await loadUserPosts();
    } else {
      Message.error('用户不存在');
      router.push('/404');
    }
  } catch {
    Message.error('加载用户信息失败');
    router.push('/404');
  }
};

watch(
  () => route.params.userId,
  () => {
    loadUserProfile();
  }
);

watch([currentPage, pageSize], () => {
  if (userProfile.value) {
    loadUserPosts();
  }
});

/* --- Event handlers --- */
const toggleFollow = async () => {
  followLoading.value = true;
  try {
    const response = isFollowing.value
      ? await userFollowApi.unfollowUser(userIdNum.value)
      : await userFollowApi.followUser(userIdNum.value);

    if (response.code === 200) {
      isFollowing.value = !isFollowing.value;
      Message.success(isFollowing.value ? '已取消关注' : '关注成功');
      await loadUserStats();
    }
  } finally {
    followLoading.value = false;
  }
};

const showFollowingList = async () => {
  const response = await userFollowApi.listFollowingUsers(userIdNum.value, 1, 50);
  if (response.code === 200) {
    followingUsers.value = response.data.rows;
    showFollowingDialog.value = true;
  }
};

const showFollowerList = async () => {
  const response = await userFollowApi.listFollowerUsers(userIdNum.value, 1, 50);
  if (response.code === 200) {
    followerUsers.value = response.data.rows;
    showFollowerDialog.value = true;
  }
};

const startChat = () => {
  router.push(`/chat/${userIdNum.value}?name=${userProfile.value?.username || ''}`);
};

const formatGender = (g?: string) =>
  g === 'MALE' ? '男' : g === 'FEMALE' ? '女' : '-';

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('zh-CN') : '';

const goToPostDetail = (id: number) => router.push(`/post/${id}`);

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};
</script>

<template>
  <div class="user-profile-public">
    <a-card class="profile-header">
      <div class="profile-main">
        <div class="profile-avatar">
          <a-avatar :size="120">
            <img v-if="userProfile?.avatar" :src="getAvatarUrl(userProfile.avatar)" alt="" />
            {{ userProfile?.username?.charAt(0).toUpperCase() }}
          </a-avatar>
        </div>
        <div class="profile-info">
          <div class="profile-basic">
            <h2 class="profile-username">{{ userProfile?.username }}</h2>
            <div class="profile-stats">
              <div class="stat-item" @click="showFollowingList">
                <span class="stat-number">
                  {{ userStats.followingCount }}
                </span>
                <span class="stat-label">关注</span>
              </div>
              <div class="stat-item" @click="showFollowerList">
                <span class="stat-number">
                  {{ userStats.followerCount }}
                </span>
                <span class="stat-label">粉丝</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ postCount }}</span>
                <span class="stat-label">文章</span>
              </div>
            </div>
          </div>
          <div class="profile-actions">
            <a-button
              v-if="showFollowButton"
              :type="isFollowing ? 'secondary' : 'primary'"
              @click="toggleFollow"
              :loading="followLoading"
              size="large"
            >
              <template #icon><icon-star /></template>
              {{ isFollowing ? '取消关注' : '关注' }}
            </a-button>
            <a-button
              v-if="canChat"
              type="primary"
              status="success"
              @click="startChat"
              size="large"
            >
              <template #icon><icon-user /></template>
              发消息
            </a-button>
          </div>
        </div>
      </div>
    </a-card>

    <a-card class="profile-content">
      <a-tabs v-model:active-key="activeTab" class="profile-tabs">
        <a-tab-pane key="posts" title="文章">
          <div class="tab-pane-container">
            <a-empty v-if="posts.length === 0" description="暂无文章" />
            <div v-else class="posts-grid">
              <a-card
                v-for="post in posts"
                :key="post.id"
                class="post-card"
                hoverable
                @click="goToPostDetail(post.id)"
              >
                <h3 class="post-title">{{ post.title }}</h3>
                <div class="post-meta">
                  <span class="post-date">
                    {{ formatDate(post.createdAt) }}
                  </span>
                  <span class="post-stats">
                    <icon-eye /> {{ post.viewCount || 0 }}
                    <icon-message /> {{ post.commentCount || 0 }}
                    <icon-star /> {{ post.likeCount || 0 }}
                  </span>
                </div>
                <div v-if="post.tags && post.tags.length > 0" class="post-tags">
                  <a-tag v-for="tag in post.tags" :key="tag" size="small" color="gray" class="tag">
                    {{ tag }}
                  </a-tag>
                </div>
              </a-card>
            </div>

            <div class="pagination-wrapper" v-if="totalPosts > pageSize">
              <a-pagination
                v-model:current="currentPage"
                :page-size="pageSize"
                :total="totalPosts"
                :size-options="[10, 20, 50]"
                show-total
                show-jumper
                @change="handleCurrentChange"
                @page-size-change="handleSizeChange"
              />
            </div>
          </div>
        </a-tab-pane>

        <a-tab-pane key="collects" title="收藏">
          <UserCollectList :user-id="userIdNum" :is-owner="false" />
        </a-tab-pane>

        <a-tab-pane key="profile" title="个人信息">
          <div class="tab-pane-container">
            <a-descriptions column="1" border :label-style="{ width: 100 }">
              <a-descriptions-item label="用户名">{{ userProfile?.username || '-' }}</a-descriptions-item>
              <a-descriptions-item label="真实姓名">{{ userProfile?.realName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="性别">{{ formatGender(userProfile?.gender) }}</a-descriptions-item>
              <a-descriptions-item label="生日">{{ userProfile?.birthday ? formatDate(userProfile.birthday) : '-' }}</a-descriptions-item>
              <a-descriptions-item label="手机号">{{ userProfile?.phone || '-' }}</a-descriptions-item>
              <a-descriptions-item label="邮箱">{{ userProfile?.email || '-' }}</a-descriptions-item>
            </a-descriptions>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <a-modal
      title="关注列表"
      :visible="showFollowingDialog"
      @cancel="showFollowingDialog = false"
      :footer="null"
    >
      <UserList
        :users="followingUsers"
        :on-close="() => showFollowingDialog = false"
      />
    </a-modal>

    <a-modal
      title="粉丝列表"
      :visible="showFollowerDialog"
      @cancel="showFollowerDialog = false"
      :footer="null"
    >
      <UserList
        :users="followerUsers"
        :on-close="() => showFollowerDialog = false"
      />
    </a-modal>
  </div>
</template>
