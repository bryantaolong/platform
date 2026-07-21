import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Skeleton,
  Empty,
  Pagination,
  Badge,
  Avatar,
  Message,
} from '@arco-design/web-react';
import {
  IconMessage,
  IconArrowRight,
} from '@arco-design/web-react/icon';
import { useUserStore } from '@/stores/user';
import * as userMessageApi from '@/api/user/userMessage.ts';
import { getAvatarUrl } from '@/utils/file';
import type { ConversationVO } from '@/models/vo/user';
import './MessageList.css';

const MessageList: React.FC = () => {
  const navigate = useNavigate();
  const userStore = useUserStore();

  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<ConversationVO[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const loadConversations = useCallback(async () => {
    if (!userStore.isAuthenticated) return;

    setLoading(true);
    try {
      const response = await userMessageApi.getConversations(pageNum, pageSize);
      if (response.code === 200) {
        setConversations(response.data.rows);
        setTotal(response.data.total);
      }
    } catch (error) {
      Message.error('加载会话列表失败');
    } finally {
      setLoading(false);
    }
  }, [pageNum, pageSize, userStore.isAuthenticated]);

  const loadUnreadCount = useCallback(async () => {
    if (!userStore.isAuthenticated) return;

    try {
      const response = await userMessageApi.getUnreadCount();
      if (response.code === 200) {
        setTotalUnreadCount(response.data);
      }
    } catch (error) {
      console.error('加载未读数失败', error);
    }
  }, [userStore.isAuthenticated]);

  const getPreviewText = (conv: ConversationVO) => {
    const isSelf = conv.lastMessageSenderId === userStore.userInfo?.id;
    const prefix = isSelf ? '我: ' : '';
    const content = conv.lastMessageContent || '';
    return prefix + (content.length > 30 ? content.substring(0, 30) + '...' : content);
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 24 * 60 * 60 * 1000;

    if (diff < day && now.getDate() === date.getDate()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 2 * day) {
      return '昨天';
    } else if (diff < 7 * day) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const goToChat = (contactId: number, contactName: string) => {
    navigate({
      pathname: `/chat/${contactId}`,
      search: `?name=${encodeURIComponent(contactName)}`,
    });
  };

  const goToFollowing = () => {
    navigate('/following');
  };

  const handlePageChange = (page: number) => {
    setPageNum(page);
  };

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Polling: refresh unread count and first page every 10s
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadUnreadCount();
      if (pageNum === 1) {
        loadConversations();
      }
    }, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [loadUnreadCount, loadConversations, pageNum]);

  return (
    <div className="message-list-page">
      <Card className="message-list-card">
        <div className="card-header">
          <h2 className="page-title">
            <IconMessage />
            消息中心
          </h2>
          {totalUnreadCount > 0 && (
            <Badge count={totalUnreadCount} className="unread-badge" />
          )}
        </div>

        {loading && (
          <div className="loading-container">
            <Skeleton animation />
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div>
            <Empty description="暂无消息，去关注其他用户并开始聊天吧" />
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className="arco-btn arco-btn-primary" onClick={goToFollowing}>
                查看关注
              </button>
            </div>
          </div>
        )}

        {!loading && conversations.length > 0 && (
          <div className="conversation-list">
            {conversations.map((conv) => (
              <div
                key={conv.contactId}
                className={`conversation-item${conv.unreadCount > 0 ? ' has-unread' : ''}`}
                onClick={() => goToChat(conv.contactId, conv.contactUsername)}
              >
                <div className="avatar-section">
                  <Avatar size={48}>
                    <img src={getAvatarUrl(conv.contactAvatar)} alt="" />
                    {conv.contactUsername?.charAt(0).toUpperCase()}
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <Badge
                      count={conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      className="unread-dot"
                    />
                  )}
                </div>

                <div className="content-section">
                  <div className="conversation-header">
                    <span className="contact-name">{conv.contactUsername}</span>
                    <span className="message-time">{formatTime(conv.lastMessageTime)}</span>
                  </div>
                  <div className="conversation-preview">
                    {conv.lastMessageStatus === 1 ? (
                      <span className="recalled-text">[消息已撤回]</span>
                    ) : (
                      <span
                        className={`message-preview${conv.unreadCount > 0 ? ' unread' : ''}`}
                      >
                        {getPreviewText(conv)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="action-section">
                  <IconArrowRight className="arrow-icon" />
                </div>
              </div>
            ))}
          </div>
        )}

        {total > pageSize && (
          <div className="pagination-wrapper">
            <Pagination
              current={pageNum}
              pageSize={pageSize}
              total={total}
              showTotal
              onChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default MessageList;
