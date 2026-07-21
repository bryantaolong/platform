import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Tag,
  Message,
  Modal,
  Skeleton,
} from '@arco-design/web-react';
import {
  IconUser,
  IconClockCircle,
  IconEye,
  IconThumbUp,
  IconMessage,
  IconStar,
} from '@arco-design/web-react/icon';
import { marked } from 'marked';
import * as postApi from '@/api/post/post';
import type { PostVO } from '@/models/vo/post';
import { PostStatusEnum } from '@/models/enum';
import './PostAudit.css';

interface TagConfig {
  label: string;
  color: string;
}

const tagMap: Record<string, TagConfig> = {
  [PostStatusEnum.PUBLISHED]: { label: '已发布', color: 'green' },
  [PostStatusEnum.DRAFT]: { label: '草稿', color: 'gray' },
  [PostStatusEnum.PRIVATE]: { label: '仅自己可见', color: 'orange' },
  [PostStatusEnum.AUDITING]: { label: '审核中', color: 'blue' },
  [PostStatusEnum.RECYCLED]: { label: '回收站', color: 'red' },
};

const PostAudit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const postId = Number(id);

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostVO | null>(null);
  const [auditReason, setAuditReason] = useState('');

  const renderedContent = useMemo(() => {
    return marked.parse(post?.content || '');
  }, [post?.content]);

  const currentTag = useMemo(() => {
    return tagMap[post?.status || PostStatusEnum.AUDITING];
  }, [post?.status]);

  const loadPost = useCallback(async () => {
    if (!postId) {
      Message.error('文章ID不存在');
      return;
    }
    try {
      const res = await postApi.getPostById(postId);
      if (res.code === 200) {
        setPost(res.data as PostVO);
      } else {
        Message.error(res.message || '获取文章失败');
      }
    } catch (e) {
      Message.error('获取文章失败');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleAudit = useCallback(
    async (status: PostStatusEnum) => {
      if (status === PostStatusEnum.RECYCLED && !auditReason.trim()) {
        Message.warning('请填写驳回原因');
        return;
      }

      const isPublish = status === PostStatusEnum.PUBLISHED;
      Modal.confirm({
        title: '提示',
        content: isPublish ? '确认通过该博文？' : '确认驳回该博文？',
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          try {
            const res = await postApi.updatePostStatus(postId, status);
            if (res.code === 200) {
              Message.success(isPublish ? '已通过' : '已驳回');
              loadPost();
            } else {
              Message.error(res.message || '操作失败');
            }
          } catch (e) {
            Message.error('操作失败');
          }
        },
      });
    },
    [auditReason, postId, loadPost]
  );

  const formatDateTime = (str?: string) =>
    str ? new Date(str).toLocaleString('zh-CN') : '';

  return (
    <div className="blog-post-detail-container">
      {/* 审核操作卡片 */}
      <Card className="post-card" style={{ marginBottom: 20 }}>
        <div className="post-header">
          <span className="post-title" style={{ fontSize: 18 }}>
            博文审核
          </span>
          <Tag color={currentTag.color} size="large">
            {currentTag.label}
          </Tag>
        </div>

        {post?.status === PostStatusEnum.AUDITING ? (
          <Form style={{ marginTop: 16 }}>
            <Form.Item label="审核意见">
              <Input.TextArea
                value={auditReason}
                onChange={setAuditReason}
                rows={3}
                placeholder="选填，驳回时请填写原因"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                status="success"
                icon={<IconThumbUp />}
                onClick={() => handleAudit(PostStatusEnum.PUBLISHED)}
                style={{ marginRight: 12 }}
              >
                通过
              </Button>
              <Button
                type="primary"
                status="danger"
                icon={<IconStar />}
                onClick={() => handleAudit(PostStatusEnum.RECYCLED)}
              >
                驳回
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
            返回列表
          </Button>
        )}
      </Card>

      {/* 博文详情卡片 */}
      <Card className="post-card">
        {loading ? (
          <Skeleton animation text={{ rows: 6 }} />
        ) : post ? (
          <>
            <div className="post-header">
              <h1 className="post-title">{post.title}</h1>
              <div className="post-meta">
                <div className="meta-item">
                  <IconUser />
                  <span>{post.author}</span>
                </div>
                <div className="meta-item">
                  <IconClockCircle />
                  <span>{formatDateTime(post.createdAt)}</span>
                </div>
                {post.viewCount !== undefined && (
                  <div className="meta-item">
                    <IconEye />
                    <span>浏览: {post.viewCount}</span>
                  </div>
                )}
                {post.likeCount !== undefined && (
                  <div className="meta-item">
                    <IconThumbUp />
                    <span>点赞: {post.likeCount}</span>
                  </div>
                )}
                {post.commentCount !== undefined && (
                  <div className="meta-item">
                    <IconMessage />
                    <span>评论: {post.commentCount}</span>
                  </div>
                )}
                {post.collectCount !== undefined && (
                  <div className="meta-item">
                    <IconStar />
                    <span>收藏: {post.collectCount}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="post-content-wrapper">
              <div className="markdown-viewer">
                <div className="source-pane">
                  <div className="pane-title">源码</div>
                  <pre className="source-code">{post.content}</pre>
                </div>
                <div className="preview-pane">
                  <div className="pane-title">预览</div>
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                  />
                </div>
              </div>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="post-tags">
                {post.tags.map((tag) => (
                  <Tag key={tag} className="tag-item" color="gray">
                    {tag}
                  </Tag>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="post-empty">文章不存在</div>
        )}
      </Card>
    </div>
  );
};

export default PostAudit;
