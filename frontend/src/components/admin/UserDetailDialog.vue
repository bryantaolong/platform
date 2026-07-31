<script setup lang="ts">
import { Modal, Descriptions } from '@arco-design/web-vue';
import { formatDateTime, getStatusTag, getRoleTag } from './helper';

interface UserProfileVO {
  realName?: string;
  gender?: string;
  birthday?: string;
  avatar?: string;
}

type UserDetailData = SysUser & UserProfileVO;

interface Props {
  visible: boolean;
  user: UserDetailData | null;
  onClose: () => void;
}

defineProps<Props>();
</script>

<template>
  <Modal
    title="用户详情"
    :visible="visible"
    @cancel="onClose"
    :footer="null"
    unmount-on-exit
  >
    <Descriptions
      v-if="user"
      :column="2"
      border
      :label-style="{ width: 100 }"
      :data="[
        { label: '用户ID', value: user.id },
        { label: '用户名', value: user.username },
        { label: '手机号', value: user.phone || '-' },
        { label: '邮箱', value: user.email || '-' },
        { label: '状态', value: getStatusTag(user.status) },
        { label: '角色', value: getRoleTag(user.roles) },
        { label: '创建时间', value: formatDateTime(user.createdAt) },
        { label: '更新时间', value: formatDateTime(user.updatedAt) },
        { label: '最后登录时间', value: formatDateTime(user.lastLoginAt) || '-' },
      ]"
    />
  </Modal>
</template>
