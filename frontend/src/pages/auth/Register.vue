<template>
  <div className="register-container">
    <div className="register-card">
      <div className="register-header">
        <div className="register-title">用户注册</div>
        <div className="register-subtitle">创建您的账户</div>
      </div>

      <a-form
        :model="registerForm"
        class="register-form"
        size="large"
        @submit="handleRegister"
      >
        <a-form-item
          field="username"
          :rules="[
            { required: true, message: '请输入用户名' },
            { minLength: 2, maxLength: 20, message: '用户名长度应在2-20个字符之间' }
          ]"
        >
          <a-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            allowClear
          >
            <template #prefix><icon-user /></template>
          </a-input>
        </a-form-item>

        <a-form-item
          field="password"
          :rules="[
            { required: true, message: '请输入密码' },
            { minLength: 6, message: '密码至少6位' }
          ]"
        >
          <a-input-password
            v-model="registerForm.password"
            placeholder="请输入密码"
          >
            <template #prefix><icon-lock /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item
          field="confirmPassword"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validateConfirmPassword }
          ]"
        >
          <a-input-password
            v-model="registerForm.confirmPassword"
            placeholder="请确认密码"
          >
            <template #prefix><icon-lock /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item
          field="phone"
          :rules="[
            { match: /^1[3-9]\d{9}$/, message: '电话号码格式不正确' }
          ]"
        >
          <a-input
            v-model="registerForm.phone"
            placeholder="请输入手机号码（可选）"
            allowClear
          >
            <template #prefix><icon-phone /></template>
          </a-input>
        </a-form-item>

        <a-form-item
          field="email"
          :rules="[
            { type: 'email', message: '邮箱格式不正确' }
          ]"
        >
          <a-input
            v-model="registerForm.email"
            placeholder="请输入邮箱地址（可选）"
            allowClear
          >
            <template #prefix><icon-email /></template>
          </a-input>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            size="large"
            :loading="loading"
            class="register-button"
            html-type="submit"
          >
            注册
          </a-button>
        </a-form-item>
      </a-form>

      <div className="register-footer">
        <span>已有账号？</span>
        <a-link type="primary" @click="goLogin">
          立即登录
        </a-link>
      </div>
    </div>

    <div className="register-background">
      <div className="background-circle circle1"></div>
      <div className="background-circle circle2"></div>
      <div className="background-circle circle3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Form as Form,
  Input as Input,
  Button as Button,
  Link as Link,
  Message,
} from '@arco-design/web-vue'
import {
  IconUser,
  IconLock,
  IconPhone,
  IconEmail,
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'
import type { RegisterRequest } from '@/models/request/auth'

import './Register.css'

const router = useRouter()
const userStore = useUserStore()
const [formRef] = Form.useForm()

const loading = ref(false)
const registerForm = ref<Omit<RegisterRequest, 'phone' | 'email'> & {
  phone: string
  email: string
  confirmPassword: string
}>({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  email: '',
})

const updateField = (field: string, value: string) => {
  registerForm.value[field] = value
}

const validateConfirmPassword = (value: string | undefined, callback: (error?: string) => void) => {
  if (value !== registerForm.value.password) {
    callback('两次输入的密码不一致')
  } else {
    callback()
  }
}

const handleRegister = async () => {
  try {
    await formRef.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    const result = await userStore.register({
      username: registerForm.value.username,
      password: registerForm.value.password,
      phone: registerForm.value.phone || undefined,
      email: registerForm.value.email || undefined,
    })

    if (result.success) {
      Message.success('注册成功！正在跳转到登录页面...')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      Message.error(result.message || '注册失败')
    }
  } catch {
    Message.error('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const goLogin = () => {
  router.push('/login')
}
</script>
