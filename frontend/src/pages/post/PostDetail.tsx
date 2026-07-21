import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import {
  Card,
  Avatar,
  Button,
  Tag,
  Message,
  Modal,
  Spin,
} from '@arco-design/web-react';
import {
  IconClockCircle,
  IconEye,
  IconStar,
  IconStarFill,
  IconMessage,
  IconShareAlt,
  IconThumbUp,
  IconEdit,
  IconDelete,
  IconRobot,
} from '@arco-design/web-react/icon';
import * as postApi from '@/api/post/post';
import * as userProfileApi from '@/api/user/userProfile';
import * as userFollowApi from '@/api/user/userFollow';
import * as userPostCollectApi from '@/api/post/userPostCollect';
import { getAvatarUrl } from '@/utils/file';
import type { PostVO } from '@/models/vo/post';
import type { UserProfileVO } from '@/models/vo/user';
import CommentForm from '@/components/post/CommentForm';
import type { CommentFormRef } from '@/components/post/CommentForm';
import CommentList from '@/components/post/CommentList';
import type { CommentListRef } from '@/components/post/CommentList';
import LlmSummaryPostDialog from '@/components/llm/LlmSummaryPostDialog';
import type { LlmSummaryPostDialogRef } from '@/components/llm/LlmSummaryPostDialog';
import { useUserStore } from '@/stores/user';
import './PostDetail.css';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userStore = useUserStore();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostVO | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [showComments] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<UserProfileVO | null>(null);
  const [authorUserId, setAuthorUserId] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowButton, setShowFollowButton] = useState(false);

  const commentListRef = useRef<CommentListRef>(null);
  const summaryDialogRef = useRef<LlmSummaryPostDialogRef>(null);
  const commentFormRef = useRef<CommentFormRef>(null);

  const postId = useMemo(() => Number(id), [id]);

  const isAuthenticated = userStore.isAuthenticated;

  const checkCanManagePost = useCallback(
    (postData: PostVO | null) => {
      if (!postData || !isAuthenticated || !userStore.userInfo) {
        return false;
      }
      const isOwner = postData.userId === userStore.userInfo.id;
      return isOwner || userStore.isAdmin || userStore.isModerator;
    },
    [isAuthenticated, userStore.userInfo, userStore.isAdmin, userStore.isModerator]
  );

  const renderedContent = useMemo(() => {
    return marked.parse(post?.content || '') as string;
  }, [post?.content]);

  const checkLikeStatus = useCallback(async () => {
    if (!post) return;
    try {
      const response = await postApi.checkLikeStatus(post.id);
      if (response.code === 200) {
        setIsLiked(response.data);
      } else {
        setIsLiked(false);
      }
    } catch (error) {
      console.error('检查点赞状态失败:', error);
      setIsLiked(false);
    }
  }, [post]);

  const checkCollectStatus = useCallback(async () => {
    if (!post) return;
    try {
      const response = await userPostCollectApi.checkCollectStatus(post.id);
      if (response.code === 200) {
        setIsCollected(response.data);
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      setIsCollected(false);
    }
  }, [post]);

  const checkFollowingStatus = useCallback(
    async (userId: number) => {
      if (!isAuthenticated) {
        setShowFollowButton(false);
        return;
      }
      if (userStore.userInfo?.id === userId) {
        setShowFollowButton(false);
        return;
      }
      try {
        const response = await userFollowApi.isFollowing(userId);
        if (response.code === 200) {
          setIsFollowing(response.data);
          setShowFollowButton(true);
        }
      } catch (error) {
        console.error('检查关注状态失败:', error);
        setShowFollowButton(false);
      }
    },
    [isAuthenticated, userStore.userInfo?.id]
  );

  const loadAuthorInfo = useCallback(
    async (userId: number) => {
      try {
        setAuthorUserId(userId);
        const profileResponse = await userProfileApi.getUserProfileByUserId(userId);
        if (profileResponse.code === 200) {
          setAuthorProfile(profileResponse.data);
          await checkFollowingStatus(userId);
        }
      } catch (error) {
        console.error('加载作者信息失败:', error);
      }
    },
    [checkFollowingStatus]
  );

  const loadPost = useCallback(async () => {
    if (!postId) {
      Message.error('文章ID不存在');
      return;
    }

    try {
      const response = await postApi.getPostById(postId);
      if (response.code === 200) {
        setPost(response.data);

        if (response.data.userId) {
          await loadAuthorInfo(response.data.userId);
        }

        if (isAuthenticated) {
          await checkCollectStatus();
        }

        if (isAuthenticated) {
          await checkLikeStatus();
        }

        setCanEdit(checkCanManagePost(response.data));
      } else {
        Message.error(response.message || '获取文章失败');
      }
    } catch (error) {
      console.error('获取文章失败:', error);
      Message.error('获取文章失败');
    } finally {
      setLoading(false);
    }
  }, [postId, isAuthenticated, checkCanManagePost, checkCollectStatus, checkLikeStatus, loadAuthorInfo]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const toggleFollow = async () => {
    if (!authorUserId) return;

    setFollowLoading(true);
    try {
      const response = isFollowing
        ? await userFollowApi.unfollowUser(authorUserId)
        : await userFollowApi.followUser(authorUserId);

      if (response && response.code === 200 && response.data) {
        setIsFollowing(!isFollowing);
        Message.success(isFollowing ? '已取消关注' : '关注成功');
      } else {
        Message.error(response?.message || (isFollowing ? '取消关注失败' : '关注失败'));
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      Message.error('操作失败');
    } finally {
      setFollowLoading(false);
    }
  };

  const goToUserProfile = (username: string | undefined) => {
    if (!username) return;
    if (authorUserId) {
      navigate(`/user/${authorUserId}`);
    } else {
      Message.error('用户信息加载中');
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      Message.warning('请先登录后再点赞');
      navigate('/login');
      return;
    }

    if (!post) return;

    try {
      if (isLiked) {
        const response = await postApi.unlikePost(post.id);
        if (response.code === 200) {
          setIsLiked(false);
          setPost((prev) =>
            prev ? { ...prev, likeCount: Math.max(0, (prev.likeCount || 0) - 1) } : prev
          );
          Message.info('已取消点赞');
        } else {
          Message.error(response.message || '取消点赞失败');
        }
      } else {
        const response = await postApi.likePost(post.id);
        if (response.code === 200) {
          setIsLiked(true);
          setPost((prev) =>
            prev ? { ...prev, likeCount: (prev.likeCount || 0) + 1 } : prev
          );
          Message.success('点赞成功');
        } else {
          Message.error(response.message || '点赞失败');
        }
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      Message.error('操作失败');
    }
  };

  const handleCollect = async () => {
    if (!isAuthenticated) {
      Message.warning('请先登录后再收藏');
      navigate('/login');
      return;
    }

    if (!post) return;

    try {
      if (isCollected) {
        const response = await userPostCollectApi.cancelCollectPost(post.id);
        if (response.code === 200) {
          setIsCollected(false);
          setPost((prev) =>
            prev ? { ...prev, collectCount: Math.max(0, (prev.collectCount || 0) - 1) } : prev
          );
          Message.info('已取消收藏');
        } else {
          Message.error(response.message || '取消收藏失败');
        }
      } else {
        const response = await userPostCollectApi.collectPost(post.id);
        if (response.code === 200) {
          setIsCollected(true);
          setPost((prev) =>
            prev ? { ...prev, collectCount: (prev.collectCount || 0) + 1 } : prev
          );
          Message.success('收藏成功');
        } else {
          Message.error(response.message || '收藏失败');
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      Message.error('操作失败');
    }
  };

  const handleShare = () => {
    if (!post) return;

    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.title,
        url: url,
      });
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          Message.success('链接已复制到剪贴板');
        })
        .catch(() => {
          Modal.info({
            title: '分享文章',
            content: `复制以下链接分享:\n${url}`,
            okText: '确定',
          });
        });
    }
  };

  const handleCommentSubmit = () => {
    setShowCommentForm(false);
    commentListRef.current?.refresh();
    setPost((prev) =>
      prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev
    );
  };

  const handleCommentCountUpdate = (count: number) => {
    setPost((prev) => (prev ? { ...prev, commentCount: count } : prev));
  };

  const scrollToComments = () => {
    const commentsEl = document.querySelector('.comments-section');
    if (commentsEl) {
      commentsEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const editPost = () => {
    if (post) {
      navigate(`/post/${post.id}/edit`);
    }
  };

  const deletePost = async () => {
    try {
      await Modal.confirm({
        title: '危险操作',
        content: '确定要删除这篇文章吗？此操作不可恢复！',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          try {
            const response = await postApi.deletePost(postId);
            if (response.code === 200) {
              Message.success('文章已删除');
              navigate('/post/list');
            } else {
              Message.error(response.message || '删除失败');
            }
          } catch (error) {
            console.error('删除失败:', error);
            Message.error('删除失败');
          }
        },
      });
    } catch {
      // User cancelled
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  const openSummaryDialog = () => {
    summaryDialogRef.current?.open();
  };

  return (
    <Spin loading={loading}>
      <div className="blog-post-detail-container">
        <Card className="post-card">
          <div className="post-header">
            <h1 className="post-title">{post?.title}</h1>
            <div className="post-author-info">
              <div className="author-details">
                <Avatar
                  size={48}
                  className="author-avatar clickable"
                  onClick={() => goToUserProfile(post?.author)}
                >
                  {authorProfile?.avatar ? (
                    <img src={getAvatarUrl(authorProfile.avatar)} alt={post?.author} />
                  ) : (
                    post?.author ? post.author.charAt(0).toUpperCase() : ''
                  )}
                </Avatar>
                <div className="author-text">
                  <div
                    className="author-name clickable"
                    onClick={() => goToUserProfile(post?.author)}
                  >
                    {post?.author}
                  </div>
                  <div className="post-time">
                    <IconClockCircle />
                    <span>{formatDateTime(post?.createdAt)}</span>
                  </div>
                </div>
              </div>
              {showFollowButton && (
                <div className="follow-section">
                  <Button
                    type={isFollowing ? undefined : 'primary'}
                    status={isFollowing ? 'danger' : undefined}
                    icon={<IconStarFill />}
                    onClick={toggleFollow}
                    loading={followLoading}
                  >
                    {isFollowing ? '取消关注' : '关注'}
                  </Button>
                </div>
              )}
            </div>
            <div className="post-meta">
              {post?.viewCount !== undefined && (
                <div className="meta-item">
                  <IconEye />
                  <span>浏览: {post.viewCount}</span>
                </div>
              )}
              {post?.likeCount !== undefined && (
                <div className="meta-item">
                  <IconStar />
                  <span>点赞: {post.likeCount}</span>
                </div>
              )}
              {post?.commentCount !== undefined && (
                <div className="meta-item">
                  <IconMessage />
                  <span>评论: {post.commentCount}</span>
                </div>
              )}
              {post?.collectCount !== undefined && (
                <div className="meta-item">
                  <IconStarFill />
                  <span>收藏: {post.collectCount}</span>
                </div>
              )}
            </div>
          </div>

          <div
            className="post-content markdown-body"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />

          {post?.tags && post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <Tag key={tag} className="tag-item" color="gray">
                  {tag}
                </Tag>
              ))}
            </div>
          )}

          <div className="post-footer">
            <div className="action-buttons">
              <Button
                icon={<IconThumbUp />}
                type={isLiked ? undefined : 'default'}
                status={isLiked ? 'danger' : undefined}
                onClick={handleLike}
              >
                点赞 {post?.likeCount}
              </Button>
              <Button
                icon={<IconStarFill />}
                type={isCollected ? undefined : 'default'}
                status={isCollected ? 'warning' : undefined}
                onClick={handleCollect}
              >
                收藏 {post?.collectCount}
              </Button>
              <Button icon={<IconShareAlt />} onClick={handleShare}>
                分享
              </Button>
              <Button icon={<IconMessage />} onClick={scrollToComments}>
                评论 {post?.commentCount}
              </Button>
              <Button status="success" icon={<IconRobot />} onClick={openSummaryDialog}>
                AI 摘要
              </Button>
            </div>

            {canEdit && (
              <div className="post-actions">
                <Button type="primary" icon={<IconEdit />} onClick={editPost}>
                  编辑
                </Button>
                <Button status="danger" icon={<IconDelete />} onClick={deletePost}>
                  删除
                </Button>
              </div>
            )}
          </div>
        </Card>

        {showComments && (
          <Card className="comments-section">
            <div className="comments-header">
              <h3>评论 ({post?.commentCount || 0})</h3>
            </div>

            {showCommentForm && isAuthenticated && (
              <CommentForm
                ref={commentFormRef}
                postId={postId}
                onSubmit={handleCommentSubmit}
                onCancel={() => setShowCommentForm(false)}
              />
            )}

            {!showCommentForm && isAuthenticated && (
              <Button
                type="primary"
                size="large"
                icon={<IconEdit />}
                className="write-comment-btn"
                onClick={() => setShowCommentForm(true)}
              >
                写评论
              </Button>
            )}

            {!isAuthenticated && (
              <Button
                type="primary"
                size="large"
                icon={<IconEdit />}
                className="write-comment-btn"
                onClick={() => navigate('/login')}
              >
                登录后评论
              </Button>
            )}

            <CommentList
              ref={commentListRef}
              postId={postId}
              onUpdateTotal={handleCommentCountUpdate}
            />
          </Card>
        )}

        <LlmSummaryPostDialog
          ref={summaryDialogRef}
          title={post?.title || ''}
          content={post?.content || ''}
        />
      </div>
    </Spin>
  );
};

export default PostDetail;
