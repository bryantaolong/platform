import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Avatar,
  Button,
  Tag,
  Message,
  Modal,
  Skeleton,
  Empty,
  Input,
  Dropdown,
  Menu,
} from '@arco-design/web-react';
import {
  IconLeft,
  IconSend,
  IconMore,
} from '@arco-design/web-react/icon';
import { useUserStore } from '@/stores/user';
import * as userMessageApi from '@/api/user/userMessage';
import { getAvatarUrl } from '@/utils/file';
import type { UserMessageVO } from '@/models/vo/user';
import './ChatView.css';

const ChatView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userStore = useUserStore();

  const contactId = Number(userId);
  const contactName = searchParams.get('name') || '';

  const [contactAvatar, setContactAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<UserMessageVO[]>([]);
  const [messageText, setMessageText] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(20);
  const [_hasMore, setHasMore] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSelfMessage = useCallback(
    (msg: UserMessageVO) => msg.senderId === userStore.userInfo?.id,
    [userStore.userInfo?.id]
  );

  const canRecall = useCallback(
    (msg: UserMessageVO) => {
      if (msg.status === 1) return false;
      if (msg.senderId !== userStore.userInfo?.id) return false;
      const sentTime = new Date(msg.createdAt).getTime();
      const now = new Date().getTime();
      return now - sentTime < 2 * 60 * 1000;
    },
    [userStore.userInfo?.id]
  );

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  const checkCanChat = useCallback(async () => {
    try {
      const response = await userMessageApi.canChatWith(contactId);
      if (response.code === 200 && !response.data) {
        Message.warning('只能与互相关注的用户发送消息');
        navigate('/messages');
        return false;
      }
      return true;
    } catch (error) {
      Message.error('检查权限失败');
      navigate('/messages');
      return false;
    }
  }, [contactId, navigate]);

  const loadMessages = useCallback(
    async (isLoadMore = false) => {
      if (!isLoadMore) {
        setLoading(true);
      }
      try {
        const response = await userMessageApi.getMessageHistory(contactId, pageNum, pageSize);
        if (response.code === 200) {
          const newMessages = response.data.rows;
          if (isLoadMore) {
            setMessages((prev) => [...newMessages.reverse(), ...prev]);
          } else {
            setMessages(newMessages.reverse());
            scrollToBottom();
          }
          setHasMore(messages.length < response.data.total);

          // 从消息中提取联系人头像
          if (!contactAvatar && newMessages.length > 0) {
            const contactMsg = newMessages.find((msg) => msg.senderId === contactId);
            if (contactMsg?.senderAvatar) {
              setContactAvatar(contactMsg.senderAvatar);
            }
          }
        }
      } catch (error) {
        Message.error('加载消息失败');
      } finally {
        setLoading(false);
      }
    },
    [contactId, pageNum, pageSize, scrollToBottom, contactAvatar]
  );

  const sendMessage = useCallback(async () => {
    const content = messageText.trim();
    if (!content) return;

    setSending(true);
    try {
      const response = await userMessageApi.sendMessage({
        receiverId: contactId,
        content: content,
      });
      if (response.code === 200) {
        setMessageText('');
        setPageNum(1);
        await loadMessages();
        scrollToBottom();
      }
    } catch (error) {
      Message.error('发送失败');
    } finally {
      setSending(false);
    }
  }, [messageText, contactId, loadMessages, scrollToBottom]);

  const handleRecall = useCallback(
    async (messageId: number) => {
      try {
        await Modal.confirm({
          title: '提示',
          content: '确定要撤回这条消息吗？',
          okText: '确定',
          cancelText: '取消',
          onOk: async () => {
            try {
              const response = await userMessageApi.recallMessage(messageId);
              if (response.code === 200) {
                Message.success('撤回成功');
                await loadMessages();
              }
            } catch (error) {
              Message.error('撤回失败');
            }
          },
        });
      } catch {
        // 取消撤回
      }
    },
    [loadMessages]
  );

  const markMessagesAsRead = useCallback(async () => {
    try {
      await userMessageApi.markAsRead(contactId);
    } catch (error) {
      console.error('标记已读失败', error);
    }
  }, [contactId]);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const goBack = () => {
    navigate('/messages');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const init = async () => {
      const canChat = await checkCanChat();
      if (canChat) {
        await loadMessages();
        await markMessagesAsRead();
      }
    };
    init();
  }, [checkCanChat, loadMessages, markMessagesAsRead]);

  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      if (pageNum === 1) {
        loadMessages();
        markMessagesAsRead();
      }
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pageNum, loadMessages, markMessagesAsRead]);

  return (
    <div className="chat-page">
      <Card className="chat-card">
        <div className="chat-header">
          <Button onClick={goBack} icon={<IconLeft />} type="text">
            返回
          </Button>
          <div className="chat-title">
            <Avatar size={36} className="message-avatar">
              {contactAvatar ? (
                <img src={getAvatarUrl(contactAvatar)} alt={contactName} />
              ) : (
                contactName?.charAt(0).toUpperCase()
              )}
            </Avatar>
            <span className="contact-name">{contactName}</span>
          </div>
          <div className="header-spacer"></div>
        </div>

        <div className="chat-container" ref={chatContainerRef}>
          {loading ? (
            <div className="loading-container">
              <Skeleton animation text={{ rows: 3 }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-chat">
              <Empty description="开始发送消息吧" />
            </div>
          ) : (
            <div className="messages-wrapper">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-item${isSelfMessage(msg) ? ' is-self' : ''}`}
                >
                  <Avatar size={40} className="message-avatar">
                    {isSelfMessage(msg)
                      ? userStore.userProfile?.avatar && (
                          <img src={getAvatarUrl(userStore.userProfile.avatar)} alt={userStore.userInfo?.username} />
                        )
                      : msg.senderAvatar && (
                          <img src={getAvatarUrl(msg.senderAvatar)} alt={msg.senderUsername} />
                        )}
                    {(
                      isSelfMessage(msg)
                        ? userStore.userInfo?.username
                        : msg.senderUsername
                    )?.charAt(0).toUpperCase()}
                  </Avatar>

                  <div className="message-content-wrapper">
                    <div className="message-header">
                      <span className="sender-name">
                        {isSelfMessage(msg)
                          ? userStore.userInfo?.username
                          : msg.senderUsername}
                      </span>
                      <span className="message-time">{formatTime(msg.createdAt)}</span>
                      {msg.readStatus === 1 && isSelfMessage(msg) && (
                        <Tag size="small" color="green">
                          已读
                        </Tag>
                      )}
                      {msg.readStatus === 0 && isSelfMessage(msg) && (
                        <Tag size="small" color="gray">
                          未读
                        </Tag>
                      )}
                    </div>

                    <div className={`message-bubble${msg.status === 1 ? ' recalled' : ''}`}>
                      {msg.status === 1 ? (
                        <span className="recalled-text">消息已撤回</span>
                      ) : (
                        <span className="message-text">{msg.content}</span>
                      )}

                      {canRecall(msg) && (
                        <Dropdown
                          droplist={
                            <Menu onClickMenuItem={() => handleRecall(msg.id)}>
                              <Menu.Item key="recall">撤回</Menu.Item>
                            </Menu>
                          }
                          trigger="click"
                        >
                          <IconMore className="message-action" />
                        </Dropdown>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <div className="input-wrapper">
            <Input.TextArea
              value={messageText}
              onChange={setMessageText}
              rows={3}
              placeholder="输入消息..."
              maxLength={2000}
              showWordLimit
              onKeyDown={handleKeyDown}
              style={{ resize: 'none' }}
            />
            <div className="input-actions">
              <span className="input-tip">Ctrl + Enter 发送</span>
              <Button
                type="primary"
                icon={<IconSend />}
                onClick={sendMessage}
                loading={sending}
                disabled={!messageText.trim()}
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatView;
