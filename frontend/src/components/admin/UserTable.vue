<script setup lang="ts">
import { Space, Button, Table, Dropdown, Pagination } from '@arco-design/web-vue';
import { IconEdit, IconEye, IconLock, IconUnlock, IconDelete, IconArrowDown } from '@arco-design/web-vue/es/icon';
import type { SysUser } from '@/models/entity/user';
import { formatDateTime, getStatusTag, getRoleTag } from './helper';

interface Props {
  loading: boolean;
  data: SysUser[];
  total: number;
  pageNum: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (user: SysUser) => void;
  onView: (user: SysUser) => void;
  onResetPassword: (user: SysUser) => void;
  onBlock: (user: SysUser) => void;
  onUnblock: (user: SysUser) => void;
  onDelete: (user: SysUser) => void;
}

const emit = defineEmits<{
  (e: 'pageChange', page: number): void;
  (e: 'pageSizeChange', size: number): void;
  (e: 'edit', user: SysUser): void;
  (e: 'view', user: SysUser): void;
  (e: 'resetPassword', user: SysUser): void;
  (e: 'block', user: SysUser): void;
  (e: 'unblock', user: SysUser): void;
  (e: 'delete', user: SysUser): void;
}>();

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
    align: 'center',
  },
  {
    title: '用户名',
    dataIndex: 'username',
    minWidth: 120,
    ellipsis: true,
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    width: 140,
    align: 'center',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    minWidth: 180,
    ellipsis: true,
  },
  {
    title: '角色',
    dataIndex: 'roles',
    width: 140,
    align: 'center',
    slotName: 'role',
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    align: 'center',
    slotName: 'status',
  },
  {
    title: '最后登录时间',
    dataIndex: 'lastLoginAt',
    width: 180,
    align: 'center',
    slotName: 'lastLogin',
  },
  {
    title: '操作',
    width: 220,
    fixed: 'right' as const,
    align: 'center',
    slotName: 'action',
  },
];

const handleCommand = (command: string, record: SysUser) => {
  switch (command) {
    case 'view':
      emit('view', record);
      break;
    case 'resetPwd':
      emit('resetPassword', record);
      break;
    case 'block':
      emit('block', record);
      break;
    case 'unblock':
      emit('unblock', record);
      break;
    case 'delete':
      emit('delete', record);
      break;
  }
};
</script>

<template>
  <div className="table-container">
    <Table
      :loading="loading"
      :columns="columns"
      :data="data"
      row-key="id"
      border
      stripe
      :pagination="false"
      :scroll="{ x: 1200 }"
    >
      <template #role="{ record }">
        <span v-html="getRoleTag(record.roles)"></span>
      </template>
      <template #status="{ record }">
        <span v-html="getStatusTag(record.status)"></span>
      </template>
      <template #lastLogin="{ record }">
        {{ formatDateTime(record.lastLoginAt) }}
      </template>
      <template #action="{ record }">
        <Space>
          <Button
            size="small"
            type="primary"
            @click="emit('edit', record)"
          >
            <IconEdit />
            编辑
          </Button>
          <Dropdown>
            <Button size="small" type="primary">
              更多 <IconArrowDown />
            </Button>
            <template #content>
              <Dropdown.Option @click="handleCommand('view', record)">
                <IconEye /> 查看详情
              </Dropdown.Option>
              <Dropdown.Option @click="handleCommand('resetPwd', record)">
                <IconLock /> 重置密码
              </Dropdown.Option>
              <Dropdown.Option v-if="record.status !== 'BANNED'" @click="handleCommand('block', record)">
                <IconLock /> 封禁用户
              </Dropdown.Option>
              <Dropdown.Option v-else @click="handleCommand('unblock', record)">
                <IconUnlock /> 解封用户
              </Dropdown.Option>
              <Dropdown.Option @click="handleCommand('delete', record)" status="danger">
                <IconDelete /> 删除用户
              </Dropdown.Option>
            </template>
          </Dropdown>
        </Space>
      </template>
    </Table>
    <div className="pagination-container">
      <Pagination
        :current="pageNum"
        :page-size="pageSize"
        :total="total"
        :size-options="[10, 20, 50, 100]"
        show-total
        size-can-change
        @change="(page: number) => $emit('pageChange', page)"
        @page-size-change="(size: number) => $emit('pageSizeChange', size)"
      />
    </div>
  </div>
</template>
