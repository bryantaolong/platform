import { useState, useImperativeHandle, forwardRef } from 'react';
import { Modal, Button, Alert, Empty, Spin, Message } from '@arco-design/web-react';
import { IconRobot } from '@arco-design/web-react/icon';
import * as llmChatApi from '@/api/llm/llmChat';

interface LlmSummaryPostDialogProps {
  title: string;
  content: string;
}

export interface LlmSummaryPostDialogRef {
  open: () => void;
}

const LlmSummaryPostDialog = forwardRef<LlmSummaryPostDialogRef, LlmSummaryPostDialogProps>(
  (props, ref) => {
    const { title, content } = props;

    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [error, setError] = useState('');

    useImperativeHandle(ref, () => ({
      open: () => {
        setVisible(true);
        setError('');
      },
    }));

    const handleGenerate = async () => {
      if (!title || !content) {
        Message.warning('文章标题或内容为空');
        return;
      }

      setLoading(true);
      setError('');
      setSummary('');

      try {
        const response = await llmChatApi.generatePostSummary(title, content);
        setSummary(response.summary);
        Message.success('AI 摘要生成成功');
      } catch (err) {
        console.error('生成 AI 摘要失败:', err);
        setError('生成摘要失败，请稍后重试');
        Message.error('生成摘要失败');
      } finally {
        setLoading(false);
      }
    };

    const handleClose = () => {
      setVisible(false);
      setSummary('');
      setError('');
    };

    return (
      <Modal
        title="AI 文章摘要"
        visible={visible}
        onCancel={handleClose}
        footer={[
          <Button key="close" onClick={handleClose}>
            关闭
          </Button>,
          <Button
            key="generate"
            type="primary"
            icon={<IconRobot />}
            loading={loading}
            disabled={loading}
            onClick={handleGenerate}
          >
            {summary ? '重新生成' : '生成摘要'}
          </Button>,
        ]}
      >
        <Spin loading={loading} className="summary-content">
          {error ? (
            <Alert type="error" content={error} />
          ) : summary ? (
            <div className="summary-text">{summary}</div>
          ) : (
            <Empty description="点击下方按钮生成 AI 摘要" />
          )}
        </Spin>
      </Modal>
    );
  }
);

export default LlmSummaryPostDialog;
