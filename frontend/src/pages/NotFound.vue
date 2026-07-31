<template>
  <div className="not-found-container">
    <h1>404</h1>
    <p>抱歉，您访问的页面不存在。</p>
    <a-button type="primary" @click="goHome">返回首页</a-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import './NotFound.css'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>
