import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Empty, Tag, Select, Pagination } from '@arco-design/web-react';
import { IconEye, IconMessage, IconStar } from '@arco-design/web-react/icon';
import { useUserStore } from '@/stores/user';
import * as postApi from '@/api/post/post';
import type { PostVO } from '@/models/vo/post';
import { PostStatusEnum } from '@/models/enum';
import { formatDate } from '@/utils/date';

interface MyPostsProps {
  onPostCountChange?: (count: number) => void;
}

const MyPosts: React.FC<MyPostsProps> = ({ onPostCountChange }) => {
  const navigate = useNavigate();
  const userStore = useUserStore();

  const [posts, setPosts] = useState<PostVO[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPosts, setTotalPosts] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const statusOptions = [
    { label: '全部', value: '' },
    { label: '已发布', value: PostStatusEnum.PUBLISHED },
    { label: '草稿', value: PostStatusEnum.DRAFT },
    { label: '私密', value: PostStatusEnum.PRIVATE },
    { label: '审核中', value: PostStatusEnum.AUDITING },
    { label: '已回收', value: PostStatusEnum.RECYCLED },
  ];

  const loadPosts = useCallback(async () => {
    if (!userStore.userInfo?.id) return;
    const res = await postApi.listAllPostsByUserId(userStore.userInfo.id, currentPage, pageSize);
    if (res.code === 200) {
      let filteredPosts = res.data.rows;
      if (statusFilter) {
        filteredPosts = filteredPosts.filter((post) => post.status === statusFilter);
      }
      setPosts(filteredPosts as PostVO[]);
      setTotalPosts(filteredPosts.length);
      onPostCountChange?.(filteredPosts.length);
    }
  }, [userStore.userInfo?.id, currentPage, pageSize, statusFilter, onPostCountChange]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSizeChange = (size: number) => {
    setPageSize(size);
  };

  const handleCurrentChange = (page: number) => {
    setCurrentPage(page);
  };

  const goToPostDetail = (id: number) => navigate(`/post/${id}`);

  return (
    <div className="tab-content-container">
      <div className="filter-bar">
        <Select
          placeholder="筛选状态"
          value={statusFilter}
          onChange={handleStatusChange}
          allowClear
          style={{ width: 160 }}
          options={statusOptions}
        />
      </div>
      {posts.length === 0 ? (
        <Empty description="暂无文章" />
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <Card key={post.id} className="post-card" onClick={() => post.id && goToPostDetail(post.id)}>
              <h3 className="post-title">{post.title}</h3>
              <div className="post-meta">
                <span className="post-date">{formatDate(post.createdAt)}</span>
                <span className="post-stats">
                  <IconEye /> {post.viewCount || 0}
                  <IconMessage /> {post.commentCount || 0}
                  <IconStar /> {post.likeCount || 0}
                </span>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map((tag) => (
                    <Tag key={tag} size="small" className="tag">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {totalPosts > pageSize && (
        <div className="pagination-wrapper">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalPosts}
            sizeOptions={[10, 20, 50]}
            showTotal
            showJumper
            
            onChange={handleCurrentChange}
            onPageSizeChange={handleSizeChange}
          />
        </div>
      )}
    </div>
  );
};

export default MyPosts;
