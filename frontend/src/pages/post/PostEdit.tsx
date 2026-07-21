import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  Tag,
  Card,
  Message,
  Spin,
} from '@arco-design/web-react';
import { marked } from 'marked';
import * as postApi from '@/api/post/post.ts';
import type { Post } from '@/models/entity/post/Post.ts';
import type { PostUpdateRequest } from '@/models/request/post/PostUpdateRequest.ts';
import { useUserStore } from '@/stores/user';
import './PostEdit.css';

const categoryOptions = [
  { label: '技术分享', value: 1 },
  { label: '生活感悟', value: 2 },
  { label: '读书笔记', value: 3 },
  { label: '其他', value: 4 },
];

const PostEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userStore = useUserStore();
  const [formRef] = Form.useForm<Post>();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<React.ComponentRef<typeof Input.TextArea>>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [postForm, setPostForm] = useState<Post>({
    id: undefined,
    title: '',
    content: '',
    categoryId: 1,
    tags: [],
  });

  const postId = Number(id);

  const canManagePost = useCallback(
    (userId?: number) => {
      if (!userId || !userStore.userInfo) {
        return false;
      }
      return (
        userStore.userInfo.id === userId || userStore.isAdmin || userStore.isModerator
      );
    },
    [userStore.userInfo, userStore.isAdmin, userStore.isModerator]
  );

  const renderedContent = useMemo(() => {
    return marked.parse(postForm.content || '') as string;
  }, [postForm.content]);

  const loadPost = useCallback(async () => {
    setLoading(true);
    try {
      const response = await postApi.getPostById(postId);
      if (response.code === 200) {
        const data = response.data;
        if (!canManagePost(data.userId)) {
          Message.error('您没有权限编辑这篇文章');
          navigate(`/post/${postId}`, { replace: true });
          return;
        }
        setPostForm((prev) => ({
          ...prev,
          id: data.id,
          title: data.title,
          content: data.content,
          categoryId: data.categoryId || 1,
          tags: Array.isArray(data.tags) ? data.tags : [],
        }));
      } else {
        Message.error(response.message || '获取文章失败');
      }
    } catch (error) {
      console.error('获取文章失败:', error);
      Message.error('获取文章失败');
    } finally {
      setLoading(false);
    }
  }, [postId, canManagePost, navigate]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleFieldChange = (field: string, value: any) => {
    setPostForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitForm = async () => {
    try {
      await formRef.validate();
    } catch {
      Message.error('请完善表单信息');
      return;
    }

    setSubmitting(true);
    try {
      const requestData: PostUpdateRequest = {
        title: postForm.title,
        content: postForm.content,
        categoryId: postForm.categoryId,
        tags: postForm.tags as any,
      };

      const response = await postApi.updatePost(postId, requestData);
      if (response.code === 200) {
        Message.success('文章更新成功');
        navigate(`/post/${postId}`);
      } else {
        Message.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('更新文章失败:', error);
      Message.error('更新文章失败');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = () => {
    navigate(-1);
  };

  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await postApi.uploadPostImage(formData);
      if (response.code === 200 && response.data?.url) {
        const imageUrl = response.data.url;
        const markdownImageSyntax = `\n![图片描述](/uploads/${imageUrl})\n`;

        const textarea = contentTextareaRef.current?.dom;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const content = postForm.content;
          const newContent =
            content.substring(0, start) + markdownImageSyntax + content.substring(end);
          setPostForm((prev) => ({ ...prev, content: newContent }));
          Message.success('图片上传成功，已插入到编辑器');
        }
      } else {
        Message.error(response.message || '图片上传失败');
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      Message.error('图片上传失败');
    } finally {
      setUploadingImage(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="blog-post-edit-container">
      <Card className="form-card">
        <div className="card-header">
          <span>编辑博客文章</span>
        </div>

        <Spin loading={loading} style={{ width: '100%' }}>
          <Form<Post>
            form={formRef}
            layout="vertical"
            size="large"
            initialValues={postForm}
            className="post-form"
          >
            <Form.Item
              label="标题"
              field="title"
              rules={[
                { required: true, message: '请输入文章标题' },
                { minLength: 1, maxLength: 100, message: '标题长度应在1-100个字符之间' },
              ]}
            >
              <Input
                placeholder="请输入文章标题"
                maxLength={100}
                showWordLimit
                onChange={(value) => handleFieldChange('title', value)}
              />
            </Form.Item>

            <Form.Item
              label="分类"
              field="categoryId"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select
                placeholder="请选择分类"
                onChange={(value) => handleFieldChange('categoryId', value)}
              >
                {categoryOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="标签" field="tags">
              <div className="tags">
                {postForm.tags && postForm.tags.length
                  ? postForm.tags.map((tag) => (
                      <Tag key={tag} size="small" color="gray">
                        {tag}
                      </Tag>
                    ))
                  : null}
              </div>
            </Form.Item>

            <Form.Item
              label="内容"
              field="content"
              rules={[
                { required: true, message: '请输入文章内容' },
                { minLength: 10, message: '文章内容至少需要10个字符' },
              ]}
            >
              <div className="markdown-editor">
                <div className="editor-pane">
                  <div className="editor-toolbar">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="primary"
                      size="small"
                      onClick={triggerImageUpload}
                      loading={uploadingImage}
                    >
                      <span style={{ marginRight: 4 }}>📷</span>
                      上传图片
                    </Button>
                    <span className="hint-text">选择图片后自动插入到光标位置</span>
                  </div>
                  <Input.TextArea
                    ref={contentTextareaRef}
                    placeholder="请输入文章内容（支持 Markdown）"
                    rows={20}
                    style={{
                      height: '100%',
                      border: 'none',
                      resize: 'none',
                      fontFamily:
                        'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, monospace',
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                    onChange={(value) => handleFieldChange('content', value)}
                  />
                </div>
                <div
                  className="preview-pane markdown-body"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                onClick={submitForm}
                loading={submitting}
                style={{ marginRight: 12 }}
              >
                更新文章
              </Button>
              <Button onClick={cancel}>取消</Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default PostEdit;
