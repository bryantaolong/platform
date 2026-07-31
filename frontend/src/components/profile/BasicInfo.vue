<script setup lang="ts">
import { ref, watch } from 'vue';
import { Form, Input, Radio, DatePicker, Button } from '@arco-design/web-vue';

interface Props {
  username?: string;
  initialData: {
    realName: string;
    gender: 1 | 0;
    birthday: string;
    phone: string;
    email: string;
  };
  loading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [data: any]
}>();

const formRef = ref<any>(null);

const formModel = ref({ ...props.initialData });

watch(
  () => props.initialData,
  (val) => {
    if (val) {
      formModel.value = { ...val };
    }
  }
);

const handleSave = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    emit('save', { ...formModel.value });
  } catch {
    // validation failed
  }
};

const handleFieldChange = (key: string, value: any) => {
  formModel.value = { ...formModel.value, [key]: value };
};
</script>

<template>
  <Form ref="formRef" autoComplete="off" layout="horizontal">
    <Form.Item label="用户名">
      <Input :value="username" disabled />
    </Form.Item>

    <Form.Item
      label="真实姓名"
      field="realName"
      :rules="[
        { minLength: 2, maxLength: 20, message: '真实姓名长度应在2-20个字符之间' },
      ]"
    >
      <Input
        v-model="formModel.realName"
        placeholder="请输入真实姓名"
      />
    </Form.Item>

    <Form.Item label="性别" field="gender">
      <Radio.Group v-model="formModel.gender">
        <Radio :value="1">男</Radio>
        <Radio :value="0">女</Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item label="生日" field="birthday">
      <DatePicker
        v-model="formModel.birthday"
        placeholder="选择生日"
        style="width: 100%"
      />
    </Form.Item>

    <Form.Item
      label="手机号"
      field="phone"
      :rules="[
        {
          validator: (value: string | undefined, callback: (msg?: string) => void) => {
            if (!value) return callback();
            const pattern = /^1[3-9]\d{9}$/;
            pattern.test(value) ? callback() : callback('电话号码格式不正确');
          },
        },
      ]"
    >
      <Input
        v-model="formModel.phone"
        placeholder="请输入手机号"
      />
    </Form.Item>

    <Form.Item
      label="邮箱"
      field="email"
      :rules="[{ type: 'email', message: '邮箱格式不正确' }]"
    >
      <Input
        v-model="formModel.email"
        placeholder="请输入邮箱"
      />
    </Form.Item>

    <Form.Item wrapper-col={{ offset: 5 }}>
      <Button type="primary" :loading="loading" @click="handleSave">
        保存修改
      </Button>
    </Form.Item>
  </Form>
</template>
