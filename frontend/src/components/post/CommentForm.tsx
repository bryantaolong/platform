import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Form, Input, Button, Message } from '@arco-design/web-react';
import { IconCheck, IconClose } from '@arco-design/web-react/icon';
import type { FormInstance } from '@arco-design/web-react';
import * as commentApi from '@/api/post/postComment';
import type { CommentCreateRequest } from '@/models/request/post';

interface CommentFormProps {
  postId: number;
  parentId?: number;
  replyToUserId?: number;
  replyToUsername?: string;
  submitText?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export interface CommentFormRef {
  focus: () => void;
}

const CommentForm = forwardRef<CommentFormRef, CommentFormProps>((props, ref) => {
  const {
    postId,
    parentId,
    replyToUserId,
    replyToUsername,
    submitText = '发表评论',
    onSubmit,
    onCancel,
  } = props;

  const formRef = useRef<FormInstance>(null);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');

  const placeholder = replyToUsername ? `回复 @${replyToUsername}...` : '请输入您的评论...';

  useImperativeHandle(ref, () => ({
    focus: () => {
      const textarea = document.querySelector('.comment-form-textarea textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    },
  }));

  const handleSubmit = async () => {
    if (!content.trim()) {
      Message.warning('请输入评论内容');
      return;
    }

    if (content.length > 500) {
      Message.warning('评论内容不能超过500字');
      return;
    }

    setSubmitting(true);
    try {
      const data: CommentCreateRequest = {
        postId,
        parentId,
        replyToUserId,
        content,
      };

      const response = await commentApi.createComment(data);
      if (response.code === 200) {
        Message.success('评论发表成功');
        setContent('');
        formRef.current?.resetFields();
        onSubmit?.();
      } else {
        Message.error(response.message || '发表评论失败');
      }
    } catch (error) {
      console.error('发表评论失败:', error);
      Message.error('发表评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    formRef.current?.resetFields();
    onCancel?.();
  };

  return (
    <div className="comment-form-container">
      <Form ref={formRef} layout="vertical">
        <Form.Item>
          {replyToUsername && (
            <div className="reply-hint">
              回复 <span className="reply-user">@{replyToUsername}</span>
              <Button type="text" size="small" icon={<IconClose />} onClick={onCancel} />
            </div>
          )}
          <Input.TextArea
            className="comment-form-textarea"
            value={content}
            onChange={setContent}
            rows={4}
            placeholder={placeholder}
            maxLength={500}
            showWordLimit
            style={{ resize: 'none' }}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            icon={<IconCheck />}
            loading={submitting}
            onClick={handleSubmit}
          >
            {submitText}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={handleCancel}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
});

export default CommentForm;
