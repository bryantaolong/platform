<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Tag, Skeleton, Empty } from '@arco-design/web-vue';
import { IconMosaic, IconRefresh, IconUser, IconEye, IconMessage, IconStar, IconLoading } from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import type { PostVO } from '@/types';
import {
  getPersonalizedFeed,
  getHotFeedForNewUser,
  getUserInterests,
  refreshUserProfile
} from '@/api/recommendation/recommendation.ts';
import './PersonalizedFeed.css';

interface Props {
  refreshRef?: { current: (() => void) | null };
}

const props = withDefaults(defineProps<Props>(), {
  refreshRef: undefined,
});

const router = useRouter();
const userStore = useUserStore();

const posts = ref<PostVO[]>([]);
const interests = ref<string[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const refreshing = ref(false);
const currentPage = ref(0);
const hasMore = ref(true);

const isAuthenticated = computed(() => userStore.isAuthenticated);

const PAGE_SIZE = 10;

const getContentPreview = (content: string): string => {
  if (!content) return '';
  return content.length > 100 ? content.substring(0, 100) + '...' : content;
};

const loadFeed = async () => {
  loading.value = true;
  try {
    let res;
    if (isAuthenticated.value) {
      res = await getPersonalizedFeed(currentPage.value, PAGE_SIZE);
      // 同时加载兴趣标签
      const interestRes = await getUserInterests(10);
      if (interestRes.code === 200 && interestRes.data) {
        interests.value = interestRes.data;
      }
    } else {
      res = await getHotFeedForNewUser(currentPage.value, PAGE_SIZE);
    }

    if (res.code === 200 && res.data) {
      if (currentPage.value === 0) {
        posts.value = res.data as PostVO[];
      } else {
        posts.value = [...posts.value, ...(res.data as PostVO[])];
      }
      hasMore.value = (res.data as PostVO[]).length >= PAGE_SIZE;
    }
  } catch (error) {
    console.error('获取推荐内容失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return;

  loadingMore.value = true;
  const nextPage = currentPage.value + 1;

  try {
    let res;
    if (isAuthenticated.value) {
      res = await getPersonalizedFeed(nextPage, PAGE_SIZE);
    } else {
      res = await getHotFeedForNewUser(nextPage, PAGE_SIZE);
    }

    if (res.code === 200 && res.data) {
      const newPosts = res.data as PostVO[];
      posts.value = [...posts.value, ...newPosts];
      hasMore.value = newPosts.length >= PAGE_SIZE;
    }
    currentPage.value = nextPage;
  } catch (error) {
    console.error('加载更多推荐失败:', error);
  } finally {
    loadingMore.value = false;
  }
};

const refreshFeed = async () => {
  refreshing.value = true;
  currentPage.value = 0;
  hasMore.value = true;

  try {
    // 刷新用户画像
    await refreshUserProfile();
    // 重新加载推荐
    const res = await getPersonalizedFeed(0, PAGE_SIZE);
    if (res.code === 200 && res.data) {
      posts.value = res.data as PostVO[];
      hasMore.value = (res.data as PostVO[]).length >= PAGE_SIZE;
    }
  } catch (error) {
    console.error('刷新推荐失败:', error);
  } finally {
    refreshing.value = false;
  }
};

const goToPostDetail = (id: number) => {
  router.push(`/post/${id}`);
};

const goToExplore = () => {
  router.push('/explore');
};

// Expose refresh method via ref
watch(
  () => props.refreshRef,
  (newRef) => {
    if (newRef) {
      newRef.current = refreshFeed;
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadFeed();
});
</script>

<template>
  <div className="personalized-feed-container">
    <div className="section-header">
      <h3 className="section-title">
        <IconMosaic />
        为你推荐
      </h3>
      <div className="header-actions">
        <Button
          v-if="isAuthenticated"
          type="primary"
          size="small"
          :loading="refreshing"
          @click="refreshFeed"
        >
          <IconRefresh />
          换一批
        </Button>
      </div>
    </div>

    <!-- 兴趣标签展示 -->
    <div v-if="interests.length > 0" className="interest-tags">
      <span className="interest-label">你的兴趣：</span>
      <Tag v-for="tag in interests.slice(0, 5)" :key="tag" size="small" color="arcoblue">
        {{ tag }}
      </Tag>
    </div>

    <Skeleton v-if="loading" animation />

    <div v-if="!loading && posts.length === 0 && !isAuthenticated">
      <Empty description="登录后获取个性化推荐" />
      <p>登录后我们会根据你的兴趣为你推荐内容</p>
      <Button type="primary" @click="router.push('/login')">立即登录</Button>
    </div>

    <div v-if="!loading && posts.length === 0 && isAuthenticated">
      <Empty description="暂无推荐内容" />
      <p>去关注一些用户或浏览更多内容来丰富你的推荐</p>
      <Button type="primary" @click="goToExplore">去探索</Button>
    </div>

    <div v-if="!loading && posts.length > 0" className="feed-list">
      <div
        v-for="post in posts"
        :key="post.id"
        className="feed-item"
        @click="post.id && goToPostDetail(post.id)"
      >
        <div className="feed-content">
          <h4 className="feed-title">{{ post.title }}</h4>
          <p className="feed-preview">{{ getContentPreview(post.content) }}</p>
          <div className="feed-meta">
            <span className="feed-author">
              <IconUser />
              {{ post.author || '匿名用户' }}
            </span>
            <span className="feed-stats">
              <span><IconEye /> {{ post.viewCount || 0 }}</span>
              <span><IconMessage /> {{ post.commentCount || 0 }}</span>
              <span><IconStar /> {{ post.likeCount || 0 }}</span>
            </span>
          </div>
          <div v-if="post.tags && post.tags.length > 0" className="feed-tags">
            <Tag v-for="tag in post.tags.slice(0, 3)" :key="tag" size="small">
              {{ tag }}
            </Tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" className="load-more">
      <Button v-if="!loadingMore" type="text" @click="loadMore">
        加载更多
      </Button>
      <IconLoading v-else class="loading-icon" />
    </div>
  </div>
</template>

<style scoped>
.personalized-feed-container {
  /* same styles as original */
}
</style>
