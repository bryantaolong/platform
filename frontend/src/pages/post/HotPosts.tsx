import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { Message, Card, Empty, Skeleton } from '@arco-design/web-react';
import {
  IconFire,
  IconEye,
  IconMessage,
  IconStar,
  IconThumbUp,
  IconSun,
} from '@arco-design/web-react/icon';
import type { PostVO } from '@/models/vo/post';
import * as postHotRankApi from '@/api/post/postHotRank';
import './HotPosts.css';

const HotPosts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hotPosts, setHotPosts] = useState<PostVO[]>([]);

  const topPosts = useMemo(() => hotPosts.slice(0, 5), [hotPosts]);

  const loadHotPosts = async () => {
    setLoading(true);
    try {
      const res = await postHotRankApi.listHotPosts(20);
      if (res.code === 200 && res.data) {
        setHotPosts(res.data as PostVO[]);
      } else {
        Message.error(res.message || '获取热门文章失败');
      }
    } catch (error) {
      console.error('获取热门文章失败:', error);
      Message.error('获取热门文章失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotPosts();
  }, []);

  const getRankClass = (index: number): string => {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return '';
  };

  const formatHotScore = (score?: number): string => {
    if (!score) return '0';
    if (score >= 10000) return (score / 10000).toFixed(1) + 'w';
    if (score >= 1000) return (score / 1000).toFixed(1) + 'k';
    return score.toFixed(0);
  };

  const getContentPreview = (content?: string): string => {
    if (!content) return '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  const renderMarkdown = (text: string): string => {
    if (!text) return '';
    return marked.parse(text) as string;
  };

  const viewPost = (postId?: number) => {
    if (postId) {
      navigate(`/post/${postId}`);
    }
  };

  return (
    <div className="hot-posts-page">
      <div className="page-header">
        <h1 className="page-title">
          <IconFire />
          热门文章
        </h1>
        <p className="page-subtitle">发现最受欢迎的精彩内容</p>
      </div>

      <div className="hot-content">
        <div className="hot-content-row">
          <div className="hot-main">
            <div className="hot-list-container">
              {loading ? (
                <Skeleton animation text={{ width: ['80%', '60%', '90%', '70%', '50%'] }} />
              ) : hotPosts.length === 0 ? (
                <Empty description="暂无热门文章" />
              ) : (
                <div className="hot-list">
                  {hotPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="hot-post-card"
                      onClick={() => viewPost(post.id)}
                    >
                      <div className={`rank-badge ${getRankClass(index)}`}>
                        {index + 1}
                      </div>
                      <div className="post-content">
                        <h3 className="post-title">{post.title}</h3>
                        <div
                          className="post-preview markdown-preview"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(getContentPreview(post.content)),
                          }}
                        />
                        <div className="post-meta">
                          <div className="meta-left">
                            <span className="meta-item">
                              <IconEye />
                              {post.viewCount || 0}
                            </span>
                            <span className="meta-item">
                              <IconMessage />
                              {post.commentCount || 0}
                            </span>
                            <span className="meta-item">
                              <IconStar />
                              {post.likeCount || 0}
                            </span>
                            <span className="meta-item">
                              <IconThumbUp />
                              {post.collectCount || 0}
                            </span>
                          </div>
                          <div className="meta-right">
                            <span className="hot-score">
                              <IconSun />
                              热度 {formatHotScore(post.hotScore)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sidebar">
            <Card className="hot-rank-card">
              <div className="card-header">
                <span>TOP 5</span>
              </div>
              <div className="top-list">
                {topPosts.map((post, index) => (
                  <div
                    key={index}
                    className="top-item"
                    onClick={() => viewPost(post.id)}
                  >
                    <span className={`top-rank ${getRankClass(index)}`}>
                      {index + 1}
                    </span>
                    <span className="top-title">{post.title}</span>
                    <span className="top-score">
                      {formatHotScore(post.hotScore)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotPosts;
