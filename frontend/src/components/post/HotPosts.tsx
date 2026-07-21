import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton, Empty, Select } from '@arco-design/web-react';
import {
  IconFire,
  IconSun,
  IconEye,
  IconMessage,
  IconStar,
} from '@arco-design/web-react/icon';
import type { PostVO } from '@/models/vo/post';
import * as postHotRankApi from '@/api/post/postHotRank.ts';

const HotPosts: React.FC = () => {
  const navigate = useNavigate();
  const [hotPosts, setHotPosts] = useState<PostVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  const loadHotPosts = async (newLimit?: number) => {
    setLoading(true);
    try {
      const res = await postHotRankApi.listHotPosts(newLimit || limit);
      if (res.code === 200 && res.data) {
        setHotPosts(res.data as PostVO[]);
      }
    } catch (error) {
      console.error('获取热门文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRankClass = (index: number): string => {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return '';
  };

  const formatHotScore = (score?: number): string => {
    if (!score) return '0';
    if (score >= 1000) return (score / 1000).toFixed(1) + 'k';
    return score.toFixed(0);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    loadHotPosts(value);
  };

  const goToPostDetail = (id: number) => navigate(`/post/${id}`);

  return (
    <div className="hot-posts-container">
      <div className="section-header">
        <h3 className="section-title">
          <IconFire />
          热门文章
        </h3>
        <Select
          value={limit}
          onChange={handleLimitChange}
          size="small"
          style={{ width: 90 }}
        >
          <Select.Option value={5}>Top 5</Select.Option>
          <Select.Option value={10}>Top 10</Select.Option>
          <Select.Option value={20}>Top 20</Select.Option>
        </Select>
      </div>

      {loading && <Skeleton animation />}

      {!loading && hotPosts.length === 0 && (
        <Empty description="暂无热门文章" />
      )}

      {!loading && hotPosts.length > 0 && (
        <div className="hot-posts-list">
          {hotPosts.map((post, index) => (
            <div
              key={post.id}
              className="hot-post-item"
              onClick={() => post.id && goToPostDetail(post.id)}
            >
              <span className={`rank-number ${getRankClass(index)}`}>
                {index + 1}
              </span>
              <div className="hot-post-content">
                <h4 className="hot-post-title">{post.title}</h4>
                <div className="hot-post-meta">
                  <span className="hot-score">
                    <IconSun />
                    {formatHotScore(post.hotScore)}
                  </span>
                  <span className="hot-stats">
                    <IconEye /> {post.viewCount || 0}
                    <IconMessage /> {post.commentCount || 0}
                    <IconStar /> {post.likeCount || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HotPosts;
