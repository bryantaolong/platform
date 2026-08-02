<script setup lang="ts">
import { ref, watch } from 'vue';
import { Modal, Form, Input, Select } from '@arco-design/web-vue';
import type { UserRoleOptionVO } from '@/types';

interface Props {
  visible: boolean
  type: 'add' | 'edit'
  roleOptions: UserRoleOptionVO[]
  submitting?: boolean
  initialValues?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
  initialValues: undefined,
});

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: []
  close: []
}>()

const formRef = ref<any>(null);

const formRules: any = {
  username: [
    { required: true, message: '请输入用户名' },
    { minLength: 2, maxLength: 20, message: '用户名长度应在2-20个字符之间' },
  ],
  phone: [
    { match: /^1[3-9]\d{9}$/, message: '电话号码格式不正确' },
  ],
  email: [
    { type: 'email', message: '邮箱格式不正确' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { minLength: 6, message: '密码至少6位' },
  ],
  roleIds: [
    { required: true, message: '请选择角色' },
  ],
};

const formModel = ref({
  username: '',
  phone: '',
  email: '',
  password: '',
  roleIds: [] as number[],
});

watch(
  () => props.initialValues,
  (val) => {
    if (val) {
      formModel.value = { ...val, roleIds: val.roleIds || [] };
    }
  },
  { immediate: true }
);

watch(
  () => props.visible,
  (val) => {
    if (val && props.initialValues) {
      formModel.value = { ...props.initialValues, roleIds: props.initialValues.roleIds || [] };
    }
  }
);

const handleOk = async () => {
  try {
    await formRef.value?.validate();
    emit('submit');
  } catch {
    // validation failed
  }
};

const handleCancel = () => {
  emit('update:visible', false);
  emit('close');
};
</script>

<template>
  <Modal
    :title="type === 'add' ? '新增用户' : '编辑用户'"
    :visible="visible"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirm-loading="submitting"
    unmount-on-exit
  >
    <Form
      ref="formRef"
      :model="formModel"
      layout="vertical"
    >
      <Form.Item
        field="username"
        label="用户名"
        :rules="type === 'add' ? formRules.username : []"
      >
        <Input :disabled="type === 'edit'" placeholder="请输入用户名" />
      </Form.Item>

      <Form.Item
        field="phone"
        label="手机号"
        :rules="formRules.phone"
      >
        <Input placeholder="请输入手机号" />
      </Form.Item>

      <Form.Item
        field="email"
        label="邮箱"
        :rules="formRules.email"
      >
        <Input placeholder="请输入邮箱" />
      </Form.Item>

      <Form.Item
        v-if="type === 'add'"
        field="password"
        label="密码"
        :rules="formRules.password"
      >
        <Input.Password placeholder="请输入密码" />
      </Form.Item>

      <Form.Item
        field="roleIds"
        label="角色"
        :rules="formRules.roleIds"
      >
        <Select mode="multiple" placeholder="请选择角色">
          <a-option v-for="r in roleOptions" :key="r.id" :value="r.id">
            {{ r.roleName }}
          </a-option>
        </Select>
      </Form.Item>
    </Form>
  </Modal>
</template>
