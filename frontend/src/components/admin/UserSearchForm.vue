<script setup lang="ts">
import { Form, Input, Select, Button, Space } from '@arco-design/web-vue';
import { IconSearch, IconRefresh } from '@arco-design/web-vue/es/icon';
import type { FormInstance } from '@arco-design/web-vue';

type UserStatus = 'NORMAL' | 'LOCKED' | 'BANNED' | '';

interface UserSearchFormData {
  username: string;
  phone: string;
  email: string;
  status: UserStatus;
}

const defaultSearchForm: UserSearchFormData = {
  username: '',
  phone: '',
  email: '',
  status: '',
};

interface Props {
  form: FormInstance;
  onSearch: (data: UserSearchFormData) => void;
  onReset: () => void;
}

defineProps<Props>();
</script>

<template>
  <Form
    :model="defaultSearchForm"
    layout="inline"
    @submit="onSearch"
  >
    <Form.Item field="username" label="用户名">
      <Input placeholder="请输入用户名" allowClear />
    </Form.Item>
    <Form.Item field="phone" label="手机号">
      <Input placeholder="请输入手机号" allowClear />
    </Form.Item>
    <Form.Item field="email" label="邮箱">
      <Input placeholder="请输入邮箱" allowClear />
    </Form.Item>
    <Form.Item field="status" label="状态">
      <Select placeholder="请选择状态" allowClear :style="{ width: 120 }">
        <Select.Option value="NORMAL">正常</Select.Option>
        <Select.Option value="LOCKED">锁定</Select.Option>
        <Select.Option value="BANNED">封禁</Select.Option>
      </Select>
    </Form.Item>
    <Form.Item>
      <Space>
        <Button type="primary" htmlType="submit">
          <IconSearch />
          查询
        </Button>
        <Button @click="onReset">
          <IconRefresh />
          重置
        </Button>
      </Space>
    </Form.Item>
  </Form>
</template>
