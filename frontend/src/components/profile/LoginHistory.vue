<script setup lang="ts">
import { Table, Tag } from '@arco-design/web-vue';
import { isIPv6 } from '@/utils/ipLocation';

export interface LoginHistoryItem {
  loginTime: string;
  ipAddress: string;
  location?: string;
  device: string;
}

interface Props {
  history: LoginHistoryItem[];
}

defineProps<Props>();
</script>

<template>
  <Table :columns="[
    { title: '登录时间', dataIndex: 'loginTime', width: 180 },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      width: 220,
      slotName: 'ip',
    },
    { title: '登录地点', dataIndex: 'location' },
    { title: '设备信息', dataIndex: 'device' },
  ]" :data="history" row-key="loginTime" :pagination="false">
    <template #ip="{ record }">
      <div className="ip-info">
        <span>{{ record.ipAddress }}</span>
        <Tag
          v-if="record.ipAddress && record.ipAddress !== 'Unknown'"
          :color="isIPv6(record.ipAddress) ? 'green' : 'arcoblue'"
          size="small"
          :style="{ marginLeft: 8 }"
        >
          {{ isIPv6(record.ipAddress) ? 'IPv6' : 'IPv4' }}
        </Tag>
      </div>
    </template>
  </Table>
</template>
