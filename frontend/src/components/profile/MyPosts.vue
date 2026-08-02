<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Empty, Tag, Select, Pagination } from '@arco-design/web-vue';
import { IconEye, IconMessage, IconStar } from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import * as postApi from '@/api/post/post';
import type { PostVO, PostStatusEnum } from '@/types';
import { formatDate } from '@/utils/date';

interface Props {
  onPostCountChange?: (count: number) => void;
}

const emit = defineEmits<{
  (e: 'postCountChange', count: number): void;
}>();

const props = withDefaults(defineProps<Props>(), {
  onPostCountChange: undefined,
});

const router = useRouter();
const userStore = useUserStore();

const posts = ref<PostVO[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPosts = ref(0);
const statusFilter = ref('');

const statusOptions = [
  { label: '全部', value: '' },
  { label: '已发布', value: PostStatusEnum.PUBLISHED },
  { label: '草稿', value: PostStatusEnum.DRAFT },
  { label: '私密', value: PostStatusEnum.PRIVATE },
  { label: '审核中', value: PostStatusEnum.AUDITING },
  { label: '已回收', value: PostStatusEnum.RECYCLED },
];

const loadPosts = async () => {
  if (!userStore.userInfo?.id) return;
  const res = await postApi.listAllPostsByUserId(userStore.userInfo.id, currentPage.value, pageSize.value);
  if (res.code === 200) {
    let filteredPosts = res.data.rows;
    if (statusFilter.value) {
      filteredPosts = filteredPosts.filter((post) => post.status === statusFilter.value);
    }
    posts.value = filteredPosts as PostVO[];
    totalPosts.value = filteredPosts.length;
    props.onPostCountChange?.(filteredPosts.length);
    emit('postCountChange', filteredPosts.length);
  }
};

onMounted(() => {
  loadPosts();
});

watch(currentPage, () => {
  loadPosts();
});

watch(pageSize, () => {
  loadPosts();
});

const handleStatusChange = (value: string) => {
  statusFilter.value = value;
  currentPage.value = 1;
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const goToPostDetail = (id: number) => {
  router.push(`/post/${id}`);
};
</script>

<template>
  <div className="tab-content-container">
    <div className="filter-bar">
      <Select
        placeholder="筛选状态"
        :value="statusFilter"
        @change="handleStatusChange"
        allowClear
        :style="{ width: 160 }"
        :options="statusOptions"
      />
    </div>
    <Empty v-if="posts.length === 0" description="暂无文章" />
    <div v-else className="posts-grid">
      <Card
        v-for="post in posts"
        :key="post.id"
        className="post-card"
        @click="post.id && goToPostDetail(post.id)"
      >
        <h3 className="post-title">{{ post.title }}</h3>
        <div className="post-meta">
          <span className="post-date">{{ formatDate(post.createdAt) }}</span>
          <span className="post-stats">
            <IconEye /> {{ post.viewCount || 0 }}
            <IconMessage /> {{ post.commentCount || 0 }}
            <IconStar /> {{ post.likeCount || 0 }}
          </span>
        </div>
        <div v-if="post.tags && post.tags.length > 0" className="post-tags">
          <Tag v-for="tag in post.tags" :key="tag" size="small" className="tag">
            {{ tag }}
          </Tag>
        </div>
      </Card>
    </div>
    <div v-if="totalPosts > pageSize" className="pagination-wrapper">
      <Pagination
        :current="currentPage"
        :page-size="pageSize"
        :total="totalPosts"
        :size-options="[10, 20, 50]"
        show-total
        show-jumper
        @change="handleCurrentChange"
        @page-size-change="handleSizeChange"
      />
    </div>
  </div>
</template>
