import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Skeleton, Empty } from '@arco-design/web-react';
import { IconMosaic, IconRefresh, IconUser, IconEye, IconMessage, IconStar, IconLoading } from '@arco-design/web-react/icon';
import { useUserStore } from '@/stores/user';
import type { PostVO } from '@/models/vo/post';
import {
  getPersonalizedFeed,
  getHotFeedForNewUser,
  getUserInterests,
  refreshUserProfile
} from '@/api/recommendation/recommendation.ts';
import './PersonalizedFeed.css';

interface PersonalizedFeedProps {
  refreshRef?: React.MutableRefObject<(() => void) | null>;
}

const PersonalizedFeed: React.FC<PersonalizedFeedProps> = ({ refreshRef }) => {
  const navigate = useNavigate();
  const userStore = useUserStore();

  const [posts, setPosts] = useState<PostVO[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showInterests] = useState(true);

  const isAuthenticated = useMemo(() => userStore.isAuthenticated, [userStore.isAuthenticated]);

  const PAGE_SIZE = 10;

  const getContentPreview = (content: string): string => {
    if (!content) return '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isAuthenticated) {
        res = await getPersonalizedFeed(currentPage, PAGE_SIZE);
        // 同时加载兴趣标签
        const interestRes = await getUserInterests(10);
        if (interestRes.code === 200 && interestRes.data) {
          setInterests(interestRes.data);
        }
      } else {
        res = await getHotFeedForNewUser(currentPage, PAGE_SIZE);
      }

      if (res.code === 200 && res.data) {
        if (currentPage === 0) {
          setPosts(res.data as PostVO[]);
        } else {
          setPosts(prev => [...prev, ...(res.data as PostVO[])]);
        }
        setHasMore((res.data as PostVO[]).length >= PAGE_SIZE);
      }
    } catch (error) {
      console.error('获取推荐内容失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, isAuthenticated]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    try {
      let res;
      if (isAuthenticated) {
        res = await getPersonalizedFeed(nextPage, PAGE_SIZE);
      } else {
        res = await getHotFeedForNewUser(nextPage, PAGE_SIZE);
      }

      if (res.code === 200 && res.data) {
        const newPosts = res.data as PostVO[];
        setPosts(prev => [...prev, ...newPosts]);
        setHasMore(newPosts.length >= PAGE_SIZE);
      }
    } catch (error) {
      console.error('加载更多推荐失败:', error);
      setCurrentPage(currentPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentPage, isAuthenticated]);

  const refreshFeed = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(0);
    setHasMore(true);

    try {
      // 刷新用户画像
      await refreshUserProfile();
      // 重新加载推荐
      const res = await getPersonalizedFeed(0, PAGE_SIZE);
      if (res.code === 200 && res.data) {
        setPosts(res.data as PostVO[]);
        setHasMore((res.data as PostVO[]).length >= PAGE_SIZE);
      }
    } catch (error) {
      console.error('刷新推荐失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const goToPostDetail = useCallback((id: number) => {
    navigate(`/post/${id}`);
  }, [navigate]);

  const goToExplore = useCallback(() => {
    navigate('/explore');
  }, [navigate]);

  // Expose refresh method via ref
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = refreshFeed;
    }
  }, [refreshFeed, refreshRef]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <div className="personalized-feed-container">
      <div className="section-header">
        <h3 className="section-title">
          <IconMosaic />
          为你推荐
        </h3>
        <div className="header-actions">
          {isAuthenticated && (
            <Button
              type="primary"
              size="small"
              loading={refreshing}
              onClick={refreshFeed}
            >
              <IconRefresh />
              换一批
            </Button>
          )}
        </div>
      </div>

      {/* 兴趣标签展示 */}
      {showInterests && interests.length > 0 && (
        <div className="interest-tags">
          <span className="interest-label">你的兴趣：</span>
          {interests.slice(0, 5).map((tag) => (
            <Tag key={tag} size="small" color="arcoblue">
              {tag}
            </Tag>
          ))}
        </div>
      )}

      {loading && <Skeleton animation />}

      {!loading && posts.length === 0 && !isAuthenticated && (
        <div>
          <Empty description="登录后获取个性化推荐" />
          <p>登录后我们会根据你的兴趣为你推荐内容</p>
          <Button type="primary" onClick={() => navigate('/login')}>立即登录</Button>
        </div>
      )}

      {!loading && posts.length === 0 && isAuthenticated && (
        <div>
          <Empty description="暂无推荐内容" />
          <p>去关注一些用户或浏览更多内容来丰富你的推荐</p>
          <Button type="primary" onClick={goToExplore}>去探索</Button>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="feed-list">
          {posts.map((post) => (
            <div
              key={post.id}
              className="feed-item"
              onClick={() => post.id && goToPostDetail(post.id)}
            >
              <div className="feed-content">
                <h4 className="feed-title">{post.title}</h4>
                <p className="feed-preview">{getContentPreview(post.content)}</p>
                <div className="feed-meta">
                  <span className="feed-author">
                    <IconUser />
                    {post.author || '匿名用户'}
                  </span>
                  <span className="feed-stats">
                    <span><IconEye /> {post.viewCount || 0}</span>
                    <span><IconMessage /> {post.commentCount || 0}</span>
                    <span><IconStar /> {post.likeCount || 0}</span>
                  </span>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="feed-tags">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Tag key={tag} size="small">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 加载更多 */}
      {hasMore && (
        <div className="load-more">
          {!loadingMore ? (
            <Button type="text" onClick={loadMore}>
              加载更多
            </Button>
          ) : (
            <IconLoading className="loading-icon" />
          )}
        </div>
      )}
    </div>
  );
};

export default PersonalizedFeed;
