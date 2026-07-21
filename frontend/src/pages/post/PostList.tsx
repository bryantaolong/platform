import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { marked } from 'marked';
import {
  Card,
  Skeleton,
  Empty,
  Pagination,
  Tag,
  Message,
} from '@arco-design/web-react';
import {
  IconEye,
  IconStar,
  IconMessage,
} from '@arco-design/web-react/icon';
import * as postApi from '@/api/post/post.ts';
import type { PostSummaryVO } from '@/models/vo/post';
import HotPosts from '@/components/post/HotPosts';
import './PostList.css';

interface PaginationData {
  currentPage: number;
  pageSize: number;
  total: number;
}

const PostList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostSummaryVO[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    pageSize: 10,
    total: 0,
  });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const searchQuery = searchParams.get('search') || undefined;
      let response;

      if (searchQuery) {
        response = await postApi.listPostsByTitle(
          searchQuery,
          pagination.currentPage,
          pagination.pageSize
        );
      } else {
        response = await postApi.listAllPublishedPosts(
          pagination.currentPage,
          pagination.pageSize
        );
      }

      if (response.code === 200) {
        setPosts(response.data.rows as PostSummaryVO[]);
        setPagination((prev) => ({ ...prev, total: response.data.total }));
      } else {
        Message.error(response.message || '加载文章列表失败');
      }
    } catch (error) {
      console.error('加载文章列表失败:', error);
      Message.error('加载文章列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, searchParams]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderMarkdown = (text: string): string => {
    if (!text) return '';
    return marked.parse(text) as string;
  };

  const handleSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, pageSize: size, currentPage: 1 }));
  };

  const handleCurrentChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const viewPost = (postId: number) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="post-list-page">
      <div className="post-list-main">
        {/* Main Content: Post List */}
        <div className="post-list-container">
          {loading && <Skeleton animation />}

          {!loading && posts.length === 0 && (
            <Empty description="暂无文章" />
          )}

          {!loading && posts.length > 0 && (
            <div className="post-list">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="post-card"
                  hoverable
                  onClick={() => viewPost(post.id)}
                >
                  <div className="post-card-header">
                    <span className="author-name">{post.author}</span>
                    <span className="post-date">{formatDateTime(post.createdAt)}</span>
                  </div>

                  <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    <div
                      className="post-summary"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(post.contentPreview) }}
                    />
                  </div>

                  <div className="post-footer">
                    <div className="stats">
                      <span className="stat-item">
                        <IconEye />
                        {post.viewCount}
                      </span>
                      <span className="stat-item">
                        <IconStar />
                        {post.likeCount}
                      </span>
                      <span className="stat-item">
                        <IconMessage />
                        {post.commentCount}
                      </span>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="tags">
                        {post.tags.map((tag) => (
                          <Tag key={tag} size="small" color="arcoblue">
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && posts.length > 0 && (
            <div className="pagination-wrapper">
              <Pagination
                current={pagination.currentPage}
                pageSize={pagination.pageSize}
                total={pagination.total}
                sizeOptions={[10, 20, 50]}
                showTotal
                sizeCanChange
                onChange={handleCurrentChange}
                onPageSizeChange={handleSizeChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="post-list-sidebar">
        <HotPosts />
      </div>
    </div>
  );
};

export default PostList;
