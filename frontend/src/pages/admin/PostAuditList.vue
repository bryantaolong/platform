<template>
  <div class="post-audit-list">
    <Card class="header-card">
      <div class="header-content">
        <div class="title-section">
          <h2>博文审核</h2>
          <p class="subtitle">待审核的博文列表</p>
        </div>
      </div>
    </Card>

    <Card class="table-card">
      <Table
        :loading="loading"
        :columns="columns"
        :data="postList"
        row-key="id"
        border
        stripe
        :pagination="false"
      />

      <div class="pagination-container">
        <a-pagination
          :current="pageNum"
          :page-size="pageSize"
          :total="total"
          :size-options="[10, 20, 50]"
          show-total
          size-can-change
          @change="handleCurrentChange"
          @page-size-change="handleSizeChange"
        />
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, h } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Table, Button, Pagination, Message } from '@arco-design/web-vue';
import { IconCheck } from '@arco-design/web-vue/es/icon';
import * as postApi from '@/api/post/post';
import { PostStatusEnum } from '@/models/enum/PostStatusEnum';
import type { PostVO } from '@/models/vo/post';
import type { PageResponse } from '@/models/response/PageResponse';
import type { ApiResponse } from '@/models/response/ApiResponse';
import './PostAuditList.css';

const router = useRouter();
const loading = ref(false);
const postList = ref<PostVO[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);

const loadAuditPosts = async () => {
  loading.value = true;
  try {
    const res: ApiResponse<PageResponse<PostVO>> = await postApi.queryPosts(
      {
        title: '',
        author: '',
        tags: '',
        status: PostStatusEnum.UDITING,
      },
      pageNum.value,
      pageSize.value
    );
    if (res.code === 200) {
      postList.value = res.data.rows;
      total.value = res.data.total;
    } else {
      Message.error(res.message || '加载待审核列表失败');
    }
  } catch (error) {
    console.error('Load audit posts error:', error);
    Message.error('加载待审核列表失败');
  } finally {
    loading.value = false;
  }
};

watch([pageNum, pageSize], () => {
  loadAuditPosts();
});

onMounted(() => {
  loadAuditPosts();
});

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  pageNum.value = 1;
};

const handleCurrentChange = (page: number) => {
  pageNum.value = page;
};

const handleAudit = (row: PostVO) => {
  router.push(`/post/${row.id}/audit`);
};

const formatDate = (date: string) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
    align: 'center',
  },
  {
    title: '标题',
    dataIndex: 'title',
    minWidth: 250,
    ellipsis: true,
    render: ({ title }: { title: string }) => h('span', { class: 'post-title' }, title),
  },
  {
    title: '作者',
    dataIndex: 'author',
    width: 150,
    align: 'center',
  },
  {
    title: '提交时间',
    dataIndex: 'createdAt',
    width: 200,
    align: 'center',
    render: ({ createdAt }: { createdAt: string }) => formatDate(createdAt),
  },
  {
    title: '操作',
    width: 150,
    align: 'center',
    fixed: 'right',
    render: ({ record }: { record: PostVO }) =>
      h(Button, { type: 'primary', onClick: () => handleAudit(record) }, () => '去审核'),
  },
];
</script>
