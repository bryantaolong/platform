<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Button,
  Card,
  Divider,
  Empty,
  InputNumber,
  Message,
  Select,
  Space,
} from '@arco-design/web-vue'
import * as logApi from '@/api/admin/log'
import './SystemLog.css'

const loading = ref(false)
const logs = ref<string[]>([])
const lineCount = ref(200)
const logFiles = ref<string[]>([])
const selectedFile = ref<string>('')

const logsText = computed(() => logs.value.join('\n'))

const loadFiles = async () => {
  try {
    const res = await logApi.listLogFiles()
    if (res.code === 200) {
      const files = res.data || []
      logFiles.value = files
      if (!selectedFile.value && files.length > 0) {
        selectedFile.value = files[0]
      }
    } else {
      Message.error(res.message || '加载日志文件列表失败')
    }
  } catch (error) {
    console.error('加载日志文件列表失败:', error)
    Message.error('加载日志文件列表失败，请稍后重试')
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await logApi.listLatestLogs(lineCount.value, selectedFile.value || undefined)
    if (res.code === 200) {
      logs.value = res.data || []
    } else {
      Message.error(res.message || '加载日志失败')
    }
  } catch (error) {
    console.error('加载系统日志失败:', error)
    Message.error('加载系统日志失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFiles()
})

watch(selectedFile, () => {
  if (selectedFile.value) {
    loadLogs()
  }
})
</script>

<template>
  <div class="system-log">
    <Card class="log-card">
      <div class="log-header">
        <div class="title-section">
          <h2>系统日志</h2>
          <p class="subtitle">查看后台应用运行日志，仅管理员可访问</p>
        </div>
        <Space class="actions">
          <Select
            v-model="selectedFile"
            placeholder="选择日志文件"
            class="file-select"
            style="min-width: 200px"
          >
            <a-option v-for="file in logFiles" :key="file" :value="file">
              {{ file }}
            </a-option>
          </Select>
          <span class="lines-label">行数：</span>
          <InputNumber
            v-model="lineCount"
            :min="50"
            :max="2000"
            :step="50"
          />
          <Button type="primary" :loading="loading" @click="loadLogs">
            刷新
          </Button>
        </Space>
      </div>

      <Divider />

      <div v-if="!loading && logs.length === 0">
        <Empty description="暂无日志数据" />
      </div>
      <div v-else class="log-content">
        <pre>
          <code>{{ logsText }}</code>
        </pre>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.system-log {
  padding: 20px;
}
</style>
