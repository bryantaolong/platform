import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Radio, Button, Empty, Spin } from '@arco-design/web-react';
import * as commentApi from '@/api/post/postComment';
import type { CommentVO } from '@/models/vo/post';
import CommentItem from './CommentItem';

interface CommentListProps {
  postId: number;
  pageSize?: number;
  onUpdateTotal?: (count: number) => void;
}

export interface CommentListRef {
  refresh: () => void;
}

const CommentList = forwardRef<CommentListRef, CommentListProps>((props, ref) => {
  const { postId, pageSize = 10, onUpdateTotal } = props;

  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'latest'>('all');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<CommentVO[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadComments = async (_reset = true) => {
    if (loading) return;

    setLoading(true);
    try {
      let response;
      let count = 0;

      if (activeTab === 'all') {
        response = await commentApi.getCommentTree(postId);
        if (response.code === 200) {
          const data = response.data || [];
          setComments(data);
          count = data.length;
          setTotalCount(count);
          setHasMore(false);
        }
      } else if (activeTab === 'hot') {
        response = await commentApi.listHotComments(postId, pageSize);
        if (response.code === 200) {
          const data = response.data || [];
          setComments(data);
          count = data.length;
          setTotalCount(count);
          setHasMore(false);
        }
      } else if (activeTab === 'latest') {
        response = await commentApi.listLatestComments(postId, pageSize);
        if (response.code === 200) {
          const data = response.data || [];
          setComments(data);
          count = data.length;
          setTotalCount(count);
          setHasMore(false);
        }
      }

      onUpdateTotal?.(count);
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      loadComments(true);
    }
  }, [postId, activeTab]);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      loadComments(true);
    },
  }));

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'hot' | 'latest');
  };

  return (
    <div className="comment-list-container">
      <div className="comment-tabs">
        <Radio.Group type="button" value={activeTab} onChange={handleTabChange}>
          <Radio value="all">全部评论 ({totalCount})</Radio>
          <Radio value="hot">热评</Radio>
          <Radio value="latest">最新</Radio>
        </Radio.Group>
      </div>

      <Spin loading={loading} className="comments-content">
        {comments.length === 0 && !loading ? (
          <Empty description="暂无评论，快来抢沙发吧~" />
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(_commentId) => {
                // Handle reply - could emit to parent via a callback prop
              }}
              onLike={async (commentId) => {
                try {
                  const res = await commentApi.likeComment(commentId);
                  if (res.code === 200) {
                    loadComments();
                  }
                } catch (error) {
                  console.error('点赞失败:', error);
                }
              }}
              onDelete={async (commentId) => {
                try {
                  const res = await commentApi.deleteComment(commentId);
                  if (res.code === 200) {
                    loadComments();
                  }
                } catch (error) {
                  console.error('删除评论失败:', error);
                }
              }}
            />
          ))
        )}

        {hasMore && !loading && (
          <div className="load-more">
            <Button type="text" onClick={() => {}}>
              加载更多评论
            </Button>
          </div>
        )}
      </Spin>
    </div>
  );
});

export default CommentList;
