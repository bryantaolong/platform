import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Pagination,
  Message,
  Modal,
} from '@arco-design/web-react';
import {
  IconSearch,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconCheck,
} from '@arco-design/web-react/icon';
import type { TableProps } from '@arco-design/web-react';
import * as postApi from '@/api/post/post';
import { PostStatusEnum } from '@/models/enum';
import type { PostVO } from '@/models/vo/post';
import './PostManagement.css';

const statusOptions = [
  { label: '已发布', value: PostStatusEnum.PUBLISHED },
  { label: '审核中', value: PostStatusEnum.AUDITING },
  { label: '草稿', value: PostStatusEnum.DRAFT },
  { label: '私有', value: PostStatusEnum.PRIVATE },
  { label: '回收站', value: PostStatusEnum.RECYCLED },
];

const getStatusType = (status: PostStatusEnum): string => {
  switch (status) {
    case PostStatusEnum.PUBLISHED:
      return 'green';
    case PostStatusEnum.AUDITING:
      return 'blue';
    case PostStatusEnum.DRAFT:
      return 'gray';
    case PostStatusEnum.PRIVATE:
      return 'orange';
    case PostStatusEnum.RECYCLED:
      return 'red';
    default:
      return 'gray';
  }
};

const getStatusLabel = (status: PostStatusEnum): string => {
  switch (status) {
    case PostStatusEnum.PUBLISHED:
      return '已发布';
    case PostStatusEnum.AUDITING:
      return '审核中';
    case PostStatusEnum.DRAFT:
      return '草稿';
    case PostStatusEnum.PRIVATE:
      return '私有';
    case PostStatusEnum.RECYCLED:
      return '回收站';
    default:
      return status;
  }
};

const formatDate = (date: string): string => {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const PostManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [postList, setPostList] = useState<PostVO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchForm, setSearchForm] = useState({
    title: '',
    author: '',
    status: undefined as PostStatusEnum | undefined,
  });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postApi.queryPosts(
        {
          title: searchForm.title,
          author: searchForm.author,
          tags: '',
          status: searchForm.status,
        },
        pageNum,
        pageSize
      );
      if (res.code === 200) {
        setPostList(res.data.rows);
        setTotal(res.data.total);
      } else {
        Message.error(res.message || '加载博文列表失败');
      }
    } catch (error) {
      console.error('Load posts error:', error);
      Message.error('加载博文列表失败');
    } finally {
      setLoading(false);
    }
  }, [searchForm.title, searchForm.author, searchForm.status, pageNum, pageSize]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSearch = () => {
    setPageNum(1);
  };

  const handleReset = () => {
    setSearchForm({ title: '', author: '', status: undefined });
    setPageNum(1);
  };

  const handleSizeChange = (size: number) => {
    setPageSize(size);
    setPageNum(1);
  };

  const handleCurrentChange = (page: number) => {
    setPageNum(page);
  };

  const handleView = (row: PostVO) => {
    navigate(`/post/${row.id}`);
  };

  const handleEdit = (row: PostVO) => {
    navigate(`/post/${row.id}/edit`);
  };

  const handleAudit = (row: PostVO) => {
    navigate(`/post/${row.id}/audit`);
  };

  const handleDelete = (row: PostVO) => {
    Modal.confirm({
      title: '警告',
      content: `确定要删除博文 "${row.title}" 吗？此操作不可恢复！`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        try {
          const res = await postApi.deletePost(row.id);
          if (res.code === 200) {
            Message.success('删除成功');
            loadPosts();
          } else {
            Message.error(res.message || '删除失败');
          }
        } catch (error) {
          console.error('Delete post error:', error);
          Message.error('删除失败');
        }
      },
    });
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
      minWidth: 200,
      ellipsis: true,
      render: (_: unknown, row: PostVO) => (
        <Button type="text" size="small" onClick={() => handleView(row)}>
          {row.title}
        </Button>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      width: 120,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (_: unknown, row: PostVO) => (
        <Tag color={getStatusType(row.status as PostStatusEnum)}>
          {getStatusLabel(row.status as PostStatusEnum)}
        </Tag>
      ),
    },
    {
      title: '阅读',
      dataIndex: 'viewCount',
      width: 80,
      align: 'center',
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      width: 80,
      align: 'center',
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      width: 180,
      align: 'center',
      render: (_: unknown, row: PostVO) => formatDate(row.createdAt),
    },
    {
      title: '操作',
      width: 220,
      align: 'center',
      fixed: 'right',
      render: (_: unknown, row: PostVO) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button size="small" type="primary" icon={<IconEdit />} onClick={() => handleEdit(row)}>
            编辑
          </Button>
          {row.status === PostStatusEnum.AUDITING && (
            <Button size="small" type="primary" status="success" icon={<IconCheck />} onClick={() => handleAudit(row)}>
              审核
            </Button>
          )}
          <Button size="small" type="primary" status="danger" icon={<IconDelete />} onClick={() => handleDelete(row)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="post-management">
      <Card className="header-card">
        <div className="header-content">
          <div className="title-section">
            <h2>博文管理</h2>
            <p className="subtitle">管理系统所有博文内容</p>
          </div>
        </div>
      </Card>

      <Card className="search-card">
        <Form layout="inline" className="search-form">
          <Form.Item label="标题">
            <Input
              value={searchForm.title}
              onChange={(val) => setSearchForm((prev) => ({ ...prev, title: val }))}
              placeholder="博文标题"
              allowClear
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item label="作者">
            <Input
              value={searchForm.author}
              onChange={(val) => setSearchForm((prev) => ({ ...prev, author: val }))}
              placeholder="作者名"
              allowClear
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              value={searchForm.status}
              onChange={(val) => setSearchForm((prev) => ({ ...prev, status: val }))}
              placeholder="全部状态"
              allowClear
              style={{ width: 150 }}
            >
              {statusOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
              搜索
            </Button>
            <Button icon={<IconRefresh />} onClick={handleReset} style={{ marginLeft: 8 }}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="table-card">
        <Table
          loading={loading}
          columns={columns}
          data={postList}
          rowKey="id"
          border
          stripe
          pagination={false}
          scroll={{ x: 1000 }}
        />
        <div className="pagination-container">
          <Pagination
            current={pageNum}
            pageSize={pageSize}
            total={total}
            sizeOptions={[10, 20, 50, 100]}
            showTotal
            showJumper
            
            onChange={handleCurrentChange}
            onPageSizeChange={handleSizeChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default PostManagement;
