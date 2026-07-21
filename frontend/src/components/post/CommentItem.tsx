import { useState, useEffect } from 'react';
import { Avatar, Tag, Button, Modal, Message } from '@arco-design/web-react';
import { IconMessage, IconArrowUp, IconStar, IconDelete } from '@arco-design/web-react/icon';
import CommentForm from './CommentForm';
import * as commentApi from '@/api/post/postComment';
import { getAvatarUrl } from '@/utils/file';
import type { CommentVO } from '@/models/vo/post';

interface CommentItemProps {
  comment: CommentVO;
  isReply?: boolean;
  onReply?: (commentId: number) => void;
  onLike?: (commentId: number) => void;
  onDelete?: (commentId: number) => void;
}

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isReply = false,
  onReply,
  onLike,
  onDelete,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  // Can be extended with useUserStore() to check permissions dynamically
  const canDelete = false;

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const response = await commentApi.checkLikeStatus(comment.id);
        if (response.code === 200) {
          setIsLiked(response.data);
        }
      } catch (error) {
        console.error('检查点赞状态失败:', error);
      }
    };

    checkLikeStatus();
  }, [comment.id]);

  const handleReply = () => {
    setShowReplyForm((prev) => !prev);
    onReply?.(comment.id);
  };

  const handleReplySubmit = () => {
    setShowReplyForm(false);
    onReply?.(comment.id);
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        const response = await commentApi.unlikeComment(comment.id);
        if (response.code === 200) {
          setIsLiked(false);
          comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
          Message.info('已取消点赞');
          onLike?.(comment.id);
        } else {
          Message.error(response.message || '取消点赞失败');
        }
      } else {
        const response = await commentApi.likeComment(comment.id);
        if (response.code === 200) {
          setIsLiked(true);
          comment.likeCount = (comment.likeCount || 0) + 1;
          Message.success('点赞成功');
          onLike?.(comment.id);
        } else {
          Message.error(response.message || '点赞失败');
        }
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      Message.error('操作失败');
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '删除评论',
      content: '确定要删除这条评论吗？此操作不可恢复！',
      onOk: async () => {
        try {
          const response = await commentApi.deleteComment(comment.id);
          if (response.code === 200) {
            Message.success('评论已删除');
            onDelete?.(comment.id);
          } else {
            Message.error(response.message || '删除失败');
          }
        } catch (error) {
          console.error('删除评论失败:', error);
          Message.error('删除失败');
        }
      },
    });
  };

  const loadMoreReplies = async () => {
    try {
      const response = await commentApi.listRepliesByCommentId(comment.id);
      if (response.code === 200 && response.data) {
        if (!comment.replies) {
          comment.replies = [];
        }
        comment.replies.push(...response.data);
      }
    } catch (error) {
      console.error('加载更多回复失败:', error);
      Message.error('加载失败');
    }
  };

  return (
    <div className={`comment-item${isReply ? ' is-reply' : ''}`}>
      <div className="comment-header">
        <Avatar size={isReply ? 32 : 40}>
          <img src={getAvatarUrl(comment.avatar)} alt="" />
          {comment.username ? comment.username.charAt(0).toUpperCase() : '' }
        </Avatar>

        <div className="comment-user-info">
          <div className="comment-author">
            {comment.username}
            {comment.floor != null && (
              <Tag size="small" className="floor-tag">#{comment.floor}</Tag>
            )}
          </div>
          <div className="comment-time">{formatDateTime(comment.createdAt)}</div>
        </div>
      </div>

      <div className="comment-content">
        {comment.replyToUsername && (
          <div className="reply-to">
            回复 <span className="reply-to-user">@{comment.replyToUsername}</span>
          </div>
        )}
        <div className="content-text">{comment.content}</div>
      </div>

      <div className="comment-actions">
        <Button
          size="small"
          type="text"
          icon={<IconMessage />}
          onClick={handleReply}
        >
          回复
        </Button>
        <Button
          size="small"
          type="text"
          icon={isLiked ? <IconStar /> : <IconArrowUp />}
          status={isLiked ? 'danger' : undefined}
          onClick={handleLike}
        >
          {comment.likeCount || 0}
        </Button>
        {canDelete && (
          <Button
            size="small"
            type="text"
            icon={<IconDelete />}
            status="danger"
            onClick={handleDelete}
          >
            删除
          </Button>
        )}
      </div>

      {showReplyForm && (
        <div className="reply-form-container">
          <CommentForm
            postId={comment.postId}
            parentId={comment.id}
            replyToUserId={comment.userId}
            replyToUsername={comment.username}
            onSubmit={handleReplySubmit}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container">
          {comment.childCount != null && comment.childCount > comment.replies.length && (
            <div className="replies-header">
              <Button type="text" size="small" onClick={loadMoreReplies}>
                查看更多回复 ({comment.childCount - comment.replies.length})
              </Button>
            </div>
          )}
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
