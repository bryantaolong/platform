<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Avatar,
  Button,
  Tabs,
  TabPane,
  Modal,
  Upload,
  Message,
  Input,
  Empty,
} from '@arco-design/web-vue';
import { IconCamera } from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import * as userApi from '@/api/user/user';
import * as userProfileApi from '@/api/user/userProfile';
import * as userFollowApi from '@/api/user/userFollow';
import { getAvatarUrl } from '@/utils/file';
import { getLocationFromIp } from '@/utils/ipLocation';
import type { UserProfileVO } from '@/types';
import type { LoginHistoryItem } from '@/components/profile/LoginHistory.vue';
import MyPosts from '@/components/profile/MyPosts.vue';
import UserCollectList from '@/components/profile/UserCollectList.vue';
import BasicInfo from '@/components/profile/BasicInfo.vue';
import SecuritySettings from '@/components/profile/SecuritySettings.vue';
import LoginHistory from '@/components/profile/LoginHistory.vue';
import './UserProfile.css';
import { defineComponent, type PropType, h } from 'vue';

/* --- Utility helpers --- */
function genderToNum(g?: string): 1 | 0 {
  return g === 'FEMALE' ? 0 : 1;
}

function numToGender(n: 1 | 0): 'MALE' | 'FEMALE' {
  return n === 0 ? 'FEMALE' : 'MALE';
}

/* ===========================================================
   Child Component: UserList
   =========================================================== */
const UserList = defineComponent({
  props: {
    users: {
      type: Array as PropType<UserProfileVO[]>,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const goToUserProfile = (userId: number) => {
      router.push(`/user/${userId}`);
      props.onClose();
    };
    return { goToUserProfile, getAvatarUrl };
  },
  template: `
    <div class="users-grid">
      <a-card v-if="users.length === 0" class="user-card">
        <a-empty description="暂无用户" />
      </a-card>
      <a-card
        v-for="user in users"
        :key="user.userId"
        class="user-card"
        @click="goToUserProfile(user.userId)"
      >
        <div class="user-info">
          <a-avatar :size="40">
            <img :src="getAvatarUrl(user.avatar)" alt="" />
            {{ user.username?.charAt(0).toUpperCase() }}
          </a-avatar>
          <div class="user-text">
            <div class="user-name">{{ user.username }}</div>
            <div v-if="user.realName" class="user-real-name">{{ user.realName }}</div>
          </div>
        </div>
      </a-card>
    </div>
  `,
});

/* ===========================================================
   Main Component: UserProfile
   =========================================================== */
const router = useRouter();
const userStore = useUserStore();

const activeMainTab = ref('posts');
const editActiveTab = ref('basic');
const showFollowingDialog = ref(false);
const showFollowerDialog = ref(false);
const updating = ref(false);
const changingPassword = ref(false);
const postCount = ref(0);

const userStats = reactive({ followingCount: 0, followerCount: 0 });
const followingUsers = ref<UserProfileVO[]>([]);
const followerUsers = ref<UserProfileVO[]>([]);
const loginHistory = ref<LoginHistoryItem[]>([]);

const securitySettingsRef = ref<any>(null);

const basicForm = reactive({
  realName: '',
  gender: 1 as 1 | 0,
  birthday: '',
  phone: '',
  email: '',
});

/* --- Data loading --- */
const loadUserStats = async () => {
  if (!userStore.userInfo?.id) return;
  const res = await userFollowApi.getUserFollowStats(userStore.userInfo.id);
  if (res.code === 200) {
    userStats.followingCount = res.data.followingCount;
    userStats.followerCount = res.data.followerCount;
  }
};

const loadLoginHistory = async () => {
  if (userStore.userInfo?.lastLoginAt) {
    try {
      const ipAddress = userStore.userInfo.lastLoginIp || 'Unknown';
      let location = 'Unknown';
      if (ipAddress !== 'Unknown') {
        location = await getLocationFromIp(ipAddress);
      }
      loginHistory.value = [
        {
          loginTime: userStore.userInfo.lastLoginAt.replace('T', ' ').substring(0, 19),
          ipAddress,
          location,
          device: userStore.userInfo.lastLoginDevice || 'Unknown',
        },
      ];
    } catch (error) {
      console.error('Failed to load login history:', error);
      loginHistory.value = [
        {
          loginTime: userStore.userInfo.lastLoginAt.replace('T', ' ').substring(0, 19),
          ipAddress: 'Unknown',
          location: 'Unknown',
          device: 'Unknown',
        },
      ];
    }
  } else {
    loginHistory.value = [];
  }
};

/* --- Following/Follower list --- */
const showFollowingList = async () => {
  if (!userStore.userInfo?.id) return;
  const res = await userFollowApi.listFollowingUsers(userStore.userInfo.id, 1, 50);
  if (res.code === 200) {
    followingUsers.value = res.data.rows;
    showFollowingDialog.value = true;
  }
};

const showFollowerList = async () => {
  if (!userStore.userInfo?.id) return;
  const res = await userFollowApi.listFollowerUsers(userStore.userInfo.id, 1, 50);
  if (res.code === 200) {
    followerUsers.value = res.data.rows;
    showFollowerDialog.value = true;
  }
};

/* --- Operations --- */
const handleUpdateBasic = async (formData: {
  realName: string;
  gender: 1 | 0;
  birthday: string;
  phone: string;
  email: string;
}) => {
  updating.value = true;
  try {
    await userStore.updateProfile({
      realName: formData.realName,
      gender: numToGender(formData.gender),
      birthday: formData.birthday ? formData.birthday + 'T00:00:00' : undefined,
      avatar: userStore.userProfile?.avatar,
    });
    if (userStore.userInfo?.id) {
      await userApi.updateUser(userStore.userInfo.id, {
        phone: formData.phone,
        email: formData.email,
      });
    }
    await userStore.fetchUserInfo();
    Message.success('更新成功');
  } catch {
    Message.error('更新失败');
  } finally {
    updating.value = false;
  }
};

const handleChangePassword = async (pwdData: { oldPassword: string; newPassword: string }) => {
  changingPassword.value = true;
  try {
    const res = await userStore.changePassword(pwdData.oldPassword, pwdData.newPassword);
    if (res.success) {
      Message.success('密码修改成功');
      securitySettingsRef.value?.resetPasswordForm();
    } else {
      Message.error(res.message || '操作失败');
    }
  } finally {
    changingPassword.value = false;
  }
};

const handleDeleteAccount = () => {
  Modal.confirm({
    title: '警告',
    content: '确定注销账号吗？这是不可逆的操作！',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      Modal.confirm({
        title: '二次确认',
        content: () => h('div', {}, [
          h('p', {}, '请输入 "DELETE" 确认'),
          h(Input, {
            placeholder: 'DELETE',
            modelValue: '',
            'onUpdate:modelValue': () => {},
          }),
        ]),
        onOk: async () => {
          const res = await userStore.deleteAccount();
          if (res.success) {
            Message.success('注销成功');
            router.push('/');
          } else {
            Message.error(res.message || '注销失败');
          }
        },
      });
    },
  });
};

const handleUploadAvatar = async (file: File) => {
  try {
    const res = await userProfileApi.uploadAvatar(file);
    if (res.code === 200) {
      Message.success('头像上传成功');
      if (userStore.userProfile) {
        userStore.userProfile.avatar = res.data;
      }
    } else {
      Message.error(res.message || '上传失败');
    }
  } catch (e: any) {
    Message.error(e.message || '上传失败');
  }
};

const beforeAvatarUpload = (file: File): boolean => {
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) Message.error('大小不能超过 2MB!');
  return isLt2M;
};

/* --- Init --- */
watch(
  () => userStore.userProfile,
  (profile) => {
    if (profile) {
      basicForm.realName = profile.realName || '';
      basicForm.gender = genderToNum(profile.gender);
      basicForm.birthday = profile.birthday?.slice(0, 10) || '';
      basicForm.phone = profile.phone || '';
      basicForm.email = profile.email || '';
    }
    loadUserStats();
    loadLoginHistory();
  },
  { immediate: true }
);
</script>

<template>
  <div class="user-profile">
    <a-card class="profile-header">
      <div class="profile-main">
        <div class="profile-avatar">
          <a-upload
            action="#"
            :show-upload-list="false"
            @custom-request="(options: any) => handleUploadAvatar(options.file as File)"
            @before-upload="beforeAvatarUpload"
          >
            <div class="avatar-uploader">
              <a-avatar v-if="userStore.userProfile?.avatar" :size="120">
                <img :src="getAvatarUrl(userStore.userProfile.avatar)" alt="" />
              </a-avatar>
              <a-avatar v-else :size="120">
                {{ userStore.userInfo?.username?.charAt(0).toUpperCase() }}
              </a-avatar>
              <div class="avatar-overlay">
                <icon-camera :style="{ fontSize: 24 }" />
                <p>点击更换</p>
              </div>
            </div>
          </a-upload>
        </div>

        <div class="profile-info">
          <div class="profile-basic">
            <h2 class="profile-username">{{ userStore.userInfo?.username }}</h2>
            <div class="profile-stats">
              <div class="stat-item" @click="showFollowingList">
                <span class="stat-number">{{ userStats.followingCount }}</span>
                <span class="stat-label">关注</span>
              </div>
              <div class="stat-item" @click="showFollowerList">
                <span class="stat-number">{{ userStats.followerCount }}</span>
                <span class="stat-label">粉丝</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ postCount }}</span>
                <span class="stat-label">文章</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-card>

    <a-card class="main-content-card">
      <a-tabs v-model:active-key="activeMainTab" class="main-tabs">
        <a-tab-pane key="posts" title="我的文章">
          <MyPosts @post-count-change="(count) => postCount = count" />
        </a-tab-pane>

        <a-tab-pane key="collects" title="我的收藏">
          <UserCollectList :user-id="userStore.userInfo?.id" :is-owner="true" />
        </a-tab-pane>

        <a-tab-pane key="settings" title="设置">
          <div class="settings-container">
            <a-tabs
              v-model:active-key="editActiveTab"
              tab-position="left"
              class="settings-tabs"
            >
              <a-tab-pane key="basic" title="基本信息">
                <div class="settings-content">
                  <div class="settings-header">
                    <h3>基本信息</h3>
                    <p>管理您的个人信息，包括姓名、联系方式等</p>
                  </div>
                  <BasicInfo
                    :username="userStore.userInfo?.username"
                    :initial-data="basicForm"
                    :loading="updating"
                    @save="handleUpdateBasic"
                  />
                </div>
              </a-tab-pane>

              <a-tab-pane key="security" title="账号安全">
                <div class="settings-content">
                  <div class="settings-header">
                    <h3>账号安全</h3>
                    <p>保护您的账号安全，修改密码或进行账号注销</p>
                  </div>
                  <SecuritySettings
                    ref="securitySettingsRef"
                    :loading="changingPassword"
                    @change-password="handleChangePassword"
                    @delete-account="handleDeleteAccount"
                  />
                </div>
              </a-tab-pane>

              <a-tab-pane key="login-history" title="登录历史">
                <div class="settings-content">
                  <div class="settings-header">
                    <h3>登录历史</h3>
                    <p>查看您最近的账号登录活动</p>
                  </div>
                  <LoginHistory :history="loginHistory" />
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <a-modal
      title="我的关注"
      :visible="showFollowingDialog"
      @cancel="showFollowingDialog = false"
      :footer="null"
      style="width: 600px"
    >
      <UserList :users="followingUsers" :on-close="() => showFollowingDialog = false" />
    </a-modal>

    <a-modal
      title="我的粉丝"
      :visible="showFollowerDialog"
      @cancel="showFollowerDialog = false"
      :footer="null"
      style="width: 600px"
    >
      <UserList :users="followerUsers" :on-close="() => showFollowerDialog = false" />
    </a-modal>
  </div>
</template>
