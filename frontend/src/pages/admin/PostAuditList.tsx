import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Pagination,
  Message,
} from '@arco-design/web-react';
import type { TableProps } from '@arco-design/web-react';
import { IconCheck } from '@arco-design/web-react/icon';
import * as postApi from '@/api/post/post.ts';
import { PostStatusEnum } from '@/models/enum/PostStatusEnum';
import type { PostVO } from '@/models/vo/post';
import type { PageResult } from '@/models/response/PageResult';
import type { Result } from '@/models/response/Result';
import './PostAuditList.css';

const PostAuditList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [postList, setPostList] = useState<PostVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadAuditPosts = async () => {
    setLoading(true);
    try {
      const res: Result<PageResult<PostVO>> = await postApi.queryPosts(
        {
          title: '',
          author: '',
          tags: '',
          status: PostStatusEnum.AUDITING,
        },
        pageNum,
        pageSize
      );
      if (res.code === 200) {
        setPostList(res.data.rows);
        setTotal(res.data.total);
      } else {
        Message.error(res.message || '加载待审核列表失败');
      }
    } catch (error) {
      console.error('Load audit posts error:', error);
      Message.error('加载待审核列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditPosts();
  }, [pageNum, pageSize]);

  const handleSizeChange = (size: number) => {
    setPageSize(size);
    setPageNum(1);
  };

  const handleCurrentChange = (page: number) => {
    setPageNum(page);
  };

  const handleAudit = (row: PostVO) => {
    navigate(`/post/${row.id}/audit`);
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

  const columns: TableProps['columns'] = [
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
      render: (title: string) => <span className="post-title">{title}</span>,
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
      render: (createdAt: string) => formatDate(createdAt),
    },
    {
      title: '操作',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: unknown, record: PostVO) => (
        <Button type="primary" icon={<IconCheck />} onClick={() => handleAudit(record)}>
          去审核
        </Button>
      ),
    },
  ];

  return (
    <div className="post-audit-list">
      <Card className="header-card">
        <div className="header-content">
          <div className="title-section">
            <h2>博文审核</h2>
            <p className="subtitle">待审核的博文列表</p>
          </div>
        </div>
      </Card>

      <Card className="table-card">
        <Table<PostVO>
          loading={loading}
          columns={columns}
          data={postList}
          rowKey="id"
          border
          stripe
          pagination={false}
        />

        <div className="pagination-container">
          <Pagination
            current={pageNum}
            pageSize={pageSize}
            total={total}
            sizeOptions={[10, 20, 50]}
            showTotal
            sizeCanChange
            onChange={handleCurrentChange}
            onPageSizeChange={handleSizeChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default PostAuditList;
