import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Empty, Select, Pagination, Modal, Form, Input, Message } from '@arco-design/web-react';
import * as userPostCollectApi from '@/api/post/userPostCollect';
import * as userPostCollectionApi from '@/api/post/userPostCollection';
import type { UserPostCollection } from '@/models/entity/post';
import { formatDate } from '@/utils/date';

interface UserPostCollectItem {
  id: number;
  postId: number;
  postTitle: string;
  createdAt?: string;
}

interface UserCollectListProps {
  userId?: number;
  isOwner?: boolean;
}

const UserCollectList: React.FC<UserCollectListProps> = ({ userId, isOwner = true }) => {
  const navigate = useNavigate();

  const [collections, setCollections] = useState<UserPostCollection[]>([]);
  const [collects, setCollects] = useState<UserPostCollectItem[]>([]);
  const [totalCollects, setTotalCollects] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedCollectionValue, setSelectedCollectionValue] = useState<string | number>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const getSelectedCollectionId = (): number | undefined => {
    const value = selectedCollectionValue;
    if (value === 'all') return undefined;
    if (typeof value === 'number') return value;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  };

  const loadCollections = useCallback(async () => {
    if (!userId && !isOwner) return;
    const res = isOwner
      ? await userPostCollectionApi.listCollections()
      : await userPostCollectionApi.listCollectionsByUser(userId as number);
    if (res.code === 200 && Array.isArray(res.data)) {
      setCollections(res.data);
    }
  }, [userId, isOwner]);

  const loadCollects = useCallback(async () => {
    const collectionId = getSelectedCollectionId();
    const res = isOwner
      ? await userPostCollectApi.listUserCollects(currentPage, pageSize, collectionId)
      : await userPostCollectApi.listUserCollectsByUser(userId as number, currentPage, pageSize, collectionId);
    if (res.code === 200) {
      setCollects(res.data.rows as UserPostCollectItem[]);
      setTotalCollects(res.data.total);
    }
  }, [isOwner, userId, currentPage, pageSize, selectedCollectionValue]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    loadCollects();
  }, [loadCollects]);

  const handleCollectionChange = (value: string | number | undefined) => {
    if (value === '__create__') {
      setSelectedCollectionValue('all');
      setShowCreateDialog(true);
      return;
    }
    setCurrentPage(1);
    setSelectedCollectionValue(value ?? 'all');
  };

  const handleCurrentChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateCollection = async () => {
    const name = newFolderName.trim();
    if (!name) {
      Message.warning('请输入收藏夹名称');
      return;
    }
    setCreating(true);
    try {
      const res = await userPostCollectionApi.createCollection(name);
      if (res.code === 200 && res.data) {
        Message.success('创建收藏夹成功');
        setShowCreateDialog(false);
        setNewFolderName('');
        await loadCollections();
        setSelectedCollectionValue(res.data.id);
        setCurrentPage(1);
        await loadCollects();
      } else {
        Message.error(res.message || '创建收藏夹失败');
      }
    } catch {
      Message.error('创建收藏夹失败');
    } finally {
      setCreating(false);
    }
  };

  const goToPostDetail = (postId: number) => {
    navigate(`/post/${postId}`);
  };

  const collectOptions = [
    { label: '全部收藏', value: 'all' },
    { label: '默认收藏夹', value: 0 },
    ...collections.map((c) => ({ label: c.folderName, value: c.id })),
    ...(isOwner ? [{ label: '新建收藏夹...', value: '__create__' }] : []),
  ];

  return (
    <div className="tab-content-container">
      <div className="filter-bar">
        <Select
          placeholder="选择收藏夹"
          value={selectedCollectionValue}
          onChange={handleCollectionChange}
          allowClear
          style={{ width: 200 }}
          options={collectOptions}
        />
      </div>
      {collects.length === 0 ? (
        <Empty description="暂无收藏" />
      ) : (
        <div className="posts-grid">
          {collects.map((collect) => (
            <Card key={collect.id} className="post-card" onClick={() => goToPostDetail(collect.postId)}>
              <h3 className="post-title">{collect.postTitle}</h3>
              <div className="post-meta">
                <span className="post-date">收藏于 {formatDate(collect.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {totalCollects > pageSize && (
        <div className="pagination-wrapper">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalCollects}
            showTotal
            onChange={handleCurrentChange}
          />
        </div>
      )}
      <Modal
        title="新建收藏夹"
        visible={showCreateDialog}
        onOk={handleCreateCollection}
        onCancel={() => setShowCreateDialog(false)}
        confirmLoading={creating}
        style={{ width: 400 }}
      >
        <Form autoComplete="off">
          <Form.Item label="收藏夹名称">
            <Input
              value={newFolderName}
              onChange={setNewFolderName}
              placeholder="请输入收藏夹名称"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserCollectList;
