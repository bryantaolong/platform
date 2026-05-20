<template>
  <el-table :data="history" style="width: 100%">
    <el-table-column prop="loginTime" label="登录时间" width="180"/>
    <el-table-column prop="ipAddress" label="IP地址" width="180">
      <template #default="{ row }">
        <div class="ip-info">
          <span>{{ row.ipAddress }}</span>
          <el-tag
            v-if="row.ipAddress && row.ipAddress !== 'Unknown'"
            :type="isIPv6(row.ipAddress) ? 'success' : 'primary'"
            size="small"
            style="margin-left: 8px;"
          >
            {{ isIPv6(row.ipAddress) ? 'IPv6' : 'IPv4' }}
          </el-tag>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="location" label="登录地点"/>
    <el-table-column prop="device" label="设备信息"/>
  </el-table>
</template>

<script setup lang="ts">
import { isIPv6 } from '@/utils/ipLocation'

defineProps<{
  history: Array<{
    loginTime: string
    ipAddress: string
    location?: string
    device: string
  }>
}>()
</script>

<style scoped>
.ip-info {
  display: flex;
  align-items: center;
}
</style>

