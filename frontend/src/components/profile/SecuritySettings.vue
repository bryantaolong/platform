<script setup lang="ts">
import { ref, useImperativeHandle, forwardRef } from 'vue';
import { Form, Input, Button, Alert, Divider } from '@arco-design/web-vue';

interface Props {
  loading: boolean;
  onChangePassword: (data: { oldPassword: string; newPassword: string }) => void;
  onDeleteAccount: () => void;
}

const props = defineProps<Props>();

defineExpose({
  resetPasswordForm() {
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    formRef.value?.resetFields();
  },
});

const formRef = ref<any>(null);

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const handlePasswordChange = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    props.onChangePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    });
  } catch {
    // validation failed
  }
};

const handleFieldChange = (key: string, value: string) => {
  passwordForm.value = { ...passwordForm.value, [key]: value };
};
</script>

<template>
  <div className="security-section">
    <h3>修改密码</h3>
    <Form ref="formRef" autoComplete="off" layout="horizontal">
      <Form.Item
        label="当前密码"
        field="oldPassword"
        :rules="[{ required: true, message: '请输入当前密码' }]"
      >
        <Input.Password
          v-model="passwordForm.oldPassword"
          placeholder="请输入当前密码"
        />
      </Form.Item>

      <Form.Item
        label="新密码"
        field="newPassword"
        :rules="[
          { required: true, message: '请输入新密码' },
          { minLength: 6, message: '至少6位' },
        ]"
      >
        <Input.Password
          v-model="passwordForm.newPassword"
          placeholder="请输入新密码"
        />
      </Form.Item>

      <Form.Item
        label="确认新密码"
        field="confirmPassword"
        :rules="[
          { required: true, message: '请确认新密码' },
          {
            validator: (value: string | undefined, callback: (msg?: string) => void) => {
              value !== passwordForm.newPassword
                ? callback('两次输入不一致')
                : callback();
            },
          },
        ]"
      >
        <Input.Password
          v-model="passwordForm.confirmPassword"
          placeholder="请再次输入新密码"
        />
      </Form.Item>

      <Form.Item wrapper-col={{ offset: 5 }}>
        <Button type="primary" :loading="loading" @click="handlePasswordChange">
          修改密码
        </Button>
      </Form.Item>
    </Form>
  </div>

  <Divider />

  <div className="danger-section">
    <h3>危险操作</h3>
    <Alert type="error" content="注销账号是不可逆的操作，请谨慎操作！" showIcon />
    <Button type="primary" status="danger" style="margin-top: 16" @click="onDeleteAccount">
      注销账号
    </Button>
  </div>
</template>
