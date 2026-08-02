<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Select,
  Empty,
  Pagination,
  Modal,
  Form,
  Input,
  Message,
} from '@arco-design/web-vue';
import * as userPostCollectApi from '@/api/post/userPostCollect';
import * as userPostCollectionApi from '@/api/post/userPostCollection';
import type { UserPostCollection } from '@/types';

interface Props {
  userId?: number;
  isOwner?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  userId: undefined,
  isOwner: true,
});

const router = useRouter();

const isOwner = computed(() => props.isOwner ?? true);

const collections = ref<UserPostCollection[]>([]);
const collects = ref<any[]>([]);
const totalCollects = ref(0);
const currentPage = ref(1);
const pageSize = 10;

const selectedCollectionValue = ref<string | number>('all');
const showCreateDialog = ref(false);
const newFolderName = ref('');
const creating = ref(false);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const getSelectedCollectionId = (): number | undefined => {
  const value = selectedCollectionValue.value;
  if (value === 'all') return undefined;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const loadCollections = async () => {
  if (!props.userId && !isOwner.value) return;

  const res = isOwner.value
    ? await userPostCollectionApi.listCollections()
    : await userPostCollectionApi.listCollectionsByUser(props.userId as number);

  if (res.code === 200 && Array.isArray(res.data)) {
    collections.value = res.data;
  }
};

const loadCollects = async () => {
  const collectionId = getSelectedCollectionId();

  const res = isOwner.value
    ? await userPostCollectApi.listUserCollects(currentPage.value, pageSize, collectionId)
    : await userPostCollectApi.listUserCollectsByUser(props.userId as number, currentPage.value, pageSize, collectionId);

  if (res.code === 200) {
    collects.value = res.data.rows;
    totalCollects.value = res.data.total;
  }
};

onMounted(() => {
  loadCollections();
  loadCollects();
});

watch(
  [currentPage, pageSize, isOwner, () => props.userId],
  () => {
    loadCollects();
  }
);

const handleCollectionChange = (value: string | number) => {
  if (value === '__create__') {
    selectedCollectionValue.value = 'all';
    showCreateDialog.value = true;
    return;
  }

  currentPage.value = 1;
  selectedCollectionValue.value = value ?? 'all';
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const handleCreateCollection = async () => {
  const name = newFolderName.value.trim();
  if (!name) {
    Message.warning('请输入收藏夹名称');
    return;
  }

  creating.value = true;
  try {
    const res = await userPostCollectionApi.createCollection(name);
    if (res.code === 200 && res.data) {
      Message.success('创建收藏夹成功');
      showCreateDialog.value = false;
      newFolderName.value = '';

      await loadCollections();
      selectedCollectionValue.value = res.data.id;
      currentPage.value = 1;
      await loadCollects();
    } else {
      Message.error(res.message || '创建收藏夹失败');
    }
  } catch {
    Message.error('创建收藏夹失败');
  } finally {
    creating.value = false;
  }
};

const goToPostDetail = (postId: number) => {
  router.push(`/post/${postId}`);
};

const collectionOptions = computed(() => {
  const options: any[] = [
    { label: '全部收藏', value: 'all' },
    { label: '默认收藏夹', value: 0 },
    ...collections.value.map((c) => ({ label: c.folderName, value: c.id })),
  ];

  if (isOwner.value) {
    options.push({ label: '新建收藏夹...', value: '__create__' });
  }

  return options;
});
</script>

<template>
  <div className="tab-content-container">
    <div className="filter-bar">
      <Select
        v-model="selectedCollectionValue"
        @change="handleCollectionChange"
        :options="collectionOptions"
        placeholder="选择收藏夹"
        allowClear
      />
    </div>

    <Empty v-if="collects.length === 0" description="暂无收藏" />

    <div v-else className="posts-grid">
      <Card
        v-for="collect in collects"
        :key="collect.id"
        className="post-card"
        hoverable
        @click="goToPostDetail(collect.postId)"
      >
        <h3 className="post-title">{{ collect.postTitle }}</h3>
        <div className="post-meta">
          <span className="post-date">
            收藏于 {{ formatDate(collect.createdAt) }}
          </span>
        </div>
      </Card>
    </div>

    <div v-if="totalCollects > pageSize" className="pagination-wrapper">
      <Pagination
        v-model:current="currentPage"
        :page-size="pageSize"
        :total="totalCollects"
        showTotal
        showJumper
        @change="handleCurrentChange"
      />
    </div>

    <Modal
      title="新建收藏夹"
      :visible="showCreateDialog"
      @ok="handleCreateCollection"
      @cancel="showCreateDialog = false"
      :confirm-loading="creating"
    >
      <Form>
        <Form.Item label="收藏夹名称">
          <Input
            v-model="newFolderName"
            placeholder="请输入收藏夹名称"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
