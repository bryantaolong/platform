import { useState, useCallback } from 'react';
import { Modal, Button, Select, Input, Message } from '@arco-design/web-react';
import { marked } from 'marked';
import * as llmChatApi from '@/api/llm/llmChat';

interface ChatMessage {
  role: string;
  content: string;
}

const providerOptions = [
  { label: 'DeepSeek V3.2', value: 'deepseek' },
  { label: 'Kimi K2.5', value: 'moonshot' },
  { label: 'MiniMax-M2.1', value: 'minimax' },
];

interface LlmChatDialogProps {
  visible: boolean;
  onClose: () => void;
}

const LlmChatDialog = ({ visible, onClose }: LlmChatDialogProps) => {
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('deepseek');

  const renderMarkdown = useCallback((text: string) => {
    return marked.parse(text || '') as string;
  }, []);

  const sendMessage = async () => {
    if (!userMessage.trim()) return;

    const input = userMessage;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setUserMessage('');
    setLoading(true);

    try {
      const res = await llmChatApi.sendChatMessage(input, selectedProvider);
      setMessages((prev) => [...prev, { role: 'ai', content: res.reply }]);
    } catch (err: any) {
      const errorMessage =
        err?.message ||
        err?.msg ||
        (typeof err === 'string' ? err : '') ||
        '请求失败，请稍后重试。';
      setMessages((prev) => [...prev, { role: 'ai', content: `⚠️ ${errorMessage}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearContext = () => {
    Modal.confirm({
      title: '清空上下文确认',
      content: '确定要清空 AI 的上下文记忆吗？这会重置对话上下文。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await llmChatApi.clearChatContext();
          setMessages([]);
          Message.success(res.data || '上下文已清空');
        } catch {
          Message.error('清空失败，请稍后重试');
        }
      },
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      title="AI 聊天"
      visible={visible}
      onCancel={handleClose}
      style={{ width: 600 }}
      footer={[
        <Button key="close" onClick={handleClose}>
          关闭
        </Button>,
        <Button key="clear" status="warning" onClick={handleClearContext}>
          清空上下文
        </Button>,
        <Button key="send" type="primary" loading={loading} onClick={sendMessage}>
          发送
        </Button>,
      ]}
    >
      <div className="chat-header">
        <span className="chat-header-label">当前模型：</span>
        <Select
          value={selectedProvider}
          onChange={setSelectedProvider}
          style={{ width: 180 }}
          disabled={loading}
        >
          {providerOptions.map((item) => (
            <Select.Option key={item.value} value={item.value}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div className="chat-box">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={msg.role}>
              <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
            </div>
          ))}
        </div>
        <Input.TextArea
          value={userMessage}
          onChange={setUserMessage}
          placeholder="请输入消息..."
          rows={3}
          disabled={loading}
          onKeyDown={handleKeyDown}
        />
      </div>
    </Modal>
  );
}

export default LlmChatDialog;
