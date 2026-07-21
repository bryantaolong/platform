import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Select,
  Empty,
  Pagination,
  Modal,
  Form,
  Input,
  Message,
} from '@arco-design/web-react';
import * as userPostCollectApi from '@/api/post/userPostCollect.ts';
import * as userPostCollectionApi from '@/api/post/userPostCollection.ts';
import type { UserPostCollection } from '@/models/entity/post';

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

const UserCollectList: React.FC<UserCollectListProps> = ({
  userId,
  isOwner: isOwnerProp,
}) => {
  const navigate = useNavigate();

  const isOwner = useMemo(() => isOwnerProp ?? true, [isOwnerProp]);

  const [collections, setCollections] = useState<UserPostCollection[]>([]);
  const [collects, setCollects] = useState<UserPostCollectItem[]>([]);
  const [totalCollects, setTotalCollects] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedCollectionValue, setSelectedCollectionValue] = useState<
    string | number
  >('all');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString('zh-CN') : '';

  const getSelectedCollectionId = (): number | undefined => {
    const value = selectedCollectionValue;
    if (value === 'all') return undefined;
    if (typeof value === 'number') return value;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  };

  const loadCollections = async () => {
    if (!userId && !isOwner) return;

    const res = isOwner
      ? await userPostCollectionApi.listCollections()
      : await userPostCollectionApi.listCollectionsByUser(userId as number);

    if (res.code === 200 && Array.isArray(res.data)) {
      setCollections(res.data);
    }
  };

  const loadCollects = async () => {
    const collectionId = getSelectedCollectionId();

    const res = isOwner
      ? await userPostCollectApi.listUserCollects(
          currentPage,
          pageSize,
          collectionId
        )
      : await userPostCollectApi.listUserCollectsByUser(
          userId as number,
          currentPage,
          pageSize,
          collectionId
        );

    if (res.code === 200) {
      setCollects(res.data.rows as UserPostCollectItem[]);
      setTotalCollects(res.data.total);
    }
  };

  useEffect(() => {
    loadCollections();
    loadCollects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, isOwner, userId]);

  const handleCollectionChange = (value: string | number) => {
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

  const collectionOptions = [
    { label: '全部收藏', value: 'all' },
    { label: '默认收藏夹', value: 0 },
    ...collections.map((c) => ({ label: c.folderName, value: c.id })),
    ...(isOwner ? [{ label: '新建收藏夹...', value: '__create__' }] : []),
  ];

  return (
    <div className="tab-content-container">
      <div className="filter-bar">
        <Select
          value={selectedCollectionValue}
          onChange={handleCollectionChange}
          options={collectionOptions}
          placeholder="选择收藏夹"
          allowClear
        />
      </div>

      {collects.length === 0 ? (
        <Empty description="暂无收藏" />
      ) : (
        <div className="posts-grid">
          {collects.map((collect) => (
            <Card
              key={collect.id}
              className="post-card"
              hoverable
              onClick={() => goToPostDetail(collect.postId)}
            >
              <h3 className="post-title">{collect.postTitle}</h3>
              <div className="post-meta">
                <span className="post-date">
                  收藏于 {formatDate(collect.createdAt)}
                </span>
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
            showJumper
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
      >
        <Form>
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
