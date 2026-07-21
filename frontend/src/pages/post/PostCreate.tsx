import { useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Select,
  Tag,
  Card,
  Message,
} from '@arco-design/web-react';
import { marked } from 'marked';
import * as postApi from '@/api/post/post.ts';
import type { Post } from '@/models/entity/post/Post';
import type { PostCreateRequest } from '@/models/request/post/PostCreateRequest';
import './PostCreate.css';

const categoryOptions = [
  { label: '技术分享', value: 1 },
  { label: '生活感悟', value: 2 },
  { label: '读书笔记', value: 3 },
  { label: '其他', value: 4 },
];

const PostCreate = () => {
  const navigate = useNavigate();
  const [formRef] = Form.useForm<Post>();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [postForm, setPostForm] = useState<Post>({
    id: undefined,
    title: '',
    content: '',
    categoryId: 1,
    tags: [],
  });

  const renderedContent = useMemo(() => {
    return marked.parse(postForm.content || '');
  }, [postForm.content]);

  const addTag = useCallback(() => {
    const val = tagInput.trim();
    if (!val) return;
    if (postForm.tags.includes(val)) {
      Message.warning('标签已存在');
      setTagInput('');
      return;
    }
    setPostForm((prev) => ({ ...prev, tags: [...prev.tags, val] }));
    setTagInput('');
    tagInputRef.current?.focus();
  }, [tagInput, postForm.tags]);

  const removeTag = useCallback((idx: number) => {
    setPostForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== idx),
    }));
  }, []);

  const triggerImageUpload = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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

          const textarea = contentTextareaRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const content = postForm.content;
            const newContent =
              content.substring(0, start) +
              markdownImageSyntax +
              content.substring(end);
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
    },
    [postForm.content]
  );

  const submitForm = useCallback(async () => {
    try {
      await formRef.validate();
    } catch {
      Message.error('请完善表单信息');
      return;
    }

    setSubmitting(true);
    try {
      const requestData: PostCreateRequest = {
        title: postForm.title,
        content: postForm.content,
        categoryId: postForm.categoryId,
        tags: postForm.tags.join(','),
      };
      const response = await postApi.createPost(requestData);
      if (response.code === 200) {
        Message.success('文章发布成功');
        navigate(`/post/${response.data.id}`);
      } else {
        Message.error(response.message || '发布失败');
      }
    } catch (error) {
      console.error('发布文章失败:', error);
      Message.error('发布文章失败');
    } finally {
      setSubmitting(false);
    }
  }, [postForm, navigate]);

  const saveDraft = useCallback(async () => {
    try {
      await formRef.validate();
    } catch {
      Message.error('请完善表单信息');
      return;
    }

    setSavingDraft(true);
    try {
      const requestData: PostCreateRequest = {
        title: postForm.title,
        content: postForm.content,
        categoryId: postForm.categoryId,
        tags: postForm.tags.join(','),
      };
      const response = await postApi.savePostDraft(requestData);
      if (response.code === 200) {
        Message.success('草稿保存成功');
        navigate(`/post/${response.data.id}`);
      } else {
        Message.error(response.message || '保存草稿失败');
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      Message.error('保存草稿失败');
    } finally {
      setSavingDraft(false);
    }
  }, [postForm, navigate]);

  const cancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="blog-post-edit-container">
      <Card className="form-card">
        <div className="card-header">
          <span>编辑博客文章</span>
        </div>

        <Form<Post>
          form={formRef}
          className="post-form"
          initialValues={postForm}
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
              value={postForm.title}
              onChange={(val) =>
                setPostForm((prev) => ({ ...prev, title: val }))
              }
              placeholder="请输入文章标题"
              maxLength={100}
              showWordLimit
            />
          </Form.Item>

          <Form.Item
            label="分类"
            field="categoryId"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select
              value={postForm.categoryId}
              onChange={(val) =>
                setPostForm((prev) => ({ ...prev, categoryId: val }))
              }
              placeholder="请选择分类"
              style={{ width: '100%' }}
            >
              {categoryOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="标签" field="tags">
            <div style={{ width: '100%' }}>
              <div style={{ marginBottom: 6, minHeight: 32 }}>
                {postForm.tags.map((tag, idx) => (
                  <Tag
                    key={idx}
                    closable
                    onClose={() => removeTag(idx)}
                    style={{ marginRight: 6, marginBottom: 6 }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
              <Input
                ref={tagInputRef}
                value={tagInput}
                onChange={setTagInput}
                placeholder="输入标签后回车或失焦即可添加"
                onPressEnter={addTag}
                onBlur={addTag}
                style={{ width: '100%' }}
              />
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
                    📷 上传图片
                  </Button>
                  <span className="hint-text">选择图片后自动插入到光标位置</span>
                </div>
                <Input.TextArea
                  ref={contentTextareaRef as any}
                  value={postForm.content}
                  onChange={(val) =>
                    setPostForm((prev) => ({ ...prev, content: val }))
                  }
                  placeholder="请输入文章内容（支持 Markdown）"
                  rows={20}
                  className="content-textarea"
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
            >
              发布文章
            </Button>
            <Button
              style={{ marginLeft: 8, backgroundColor: '#00b42a', borderColor: '#00b42a', color: '#fff' }}
              onClick={saveDraft}
              loading={savingDraft}
            >
              保存草稿
            </Button>
            <Button onClick={cancel} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PostCreate;
