<template>
  <div class="blog-post-edit-container">
    <Card class="form-card">
      <div class="card-header">
        <span>编辑博客文章</span>
      </div>

      <Form ref="formRef" :model="postForm" class="post-form">
        <Form.Item
          label="标题"
          field="title"
          :rules="[
            { required: true, message: '请输入文章标题' },
            { minLength: 1, maxLength: 100, message: '标题长度应在1-100个字符之间' },
          ]"
        >
          <Input
            v-model="postForm.title"
            placeholder="请输入文章标题"
            max-length="100"
            show-word-limit
          />
        </Form.Item>

        <Form.Item
          label="分类"
          field="categoryId"
          :rules="[{ required: true, message: '请选择分类' }]"
        >
          <Select
            v-model="postForm.categoryId"
            placeholder="请选择分类"
            style="width: 100%"
          >
            <a-option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-option>
          </Select>
        </Form.Item>

        <Form.Item label="标签" field="tags">
          <div style="width: 100%">
            <div style="margin-bottom: 6; min-height: 32">
              <a-tag
                v-for="(tag, idx) in postForm.tags"
                :key="idx"
                closable
                @close="removeTag(idx)"
                style="margin-right: 6; margin-bottom: 6"
              >
                {{ tag }}
              </a-tag>
            </div>
            <Input
              ref="tagInputRef"
              v-model="tagInput"
              placeholder="输入标签后回车或失焦即可添加"
              @press-enter="addTag"
              @blur="addTag"
              style="width: 100%"
            />
          </div>
        </Form.Item>

        <Form.Item
          label="内容"
          field="content"
          :rules="[
            { required: true, message: '请输入文章内容' },
            { minLength: 10, message: '文章内容至少需要10个字符' },
          ]"
        >
          <div class="markdown-editor">
            <div class="editor-pane">
              <div class="editor-toolbar">
                <input
                  type="file"
                  ref="imageInputRef"
                  accept="image/*"
                  style="display: none"
                  @change="handleImageUpload"
                />
                <a-button
                  type="primary"
                  size="small"
                  @click="triggerImageUpload"
                  :loading="uploadingImage"
                >
                  <span style="margin-right: 4">📷</span>
                  上传图片
                </a-button>
                <span class="hint-text">选择图片后自动插入到光标位置</span>
              </div>
              <a-textarea
                ref="contentTextareaRef"
                v-model="postForm.content"
                placeholder="请输入文章内容（支持 Markdown）"
                :rows="20"
                class="content-textarea"
              />
            </div>
            <div
              class="preview-pane markdown-body"
              v-html="renderedContent"
            />
          </div>
        </Form.Item>

        <Form.Item>
          <a-button
            type="primary"
            @click="submitForm"
            :loading="submitting"
          >
            发布文章
          </a-button>
          <a-button
            style="margin-left: 8; background-color: #00b42a; border-color: #00b42a; color: #fff"
            @click="saveDraft"
            :loading="savingDraft"
          >
            保存草稿
          </a-button>
          <a-button @click="cancel" style="margin-left: 8">
            取消
          </a-button>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { marked } from 'marked';
import { Form, Input, Button, Select, Tag, Card, Message } from '@arco-design/web-vue';
import * as postApi from '@/api/post/post';
import type { Post } from '@/models/entity/post/Post';
import type { PostCreateRequest } from '@/models/request/post/PostCreateRequest';
import './PostCreate.css';

const categoryOptions = [
  { label: '技术分享', value: 1 },
  { label: '生活感悟', value: 2 },
  { label: '读书笔记', value: 3 },
  { label: '其他', value: 4 },
];

const router = useRouter();

const formRef = ref();
const imageInputRef = ref<HTMLInputElement | null>(null);
const contentTextareaRef = ref<HTMLTextAreaElement | null>(null);
const tagInputRef = ref<HTMLElement | null>(null);

const submitting = ref(false);
const savingDraft = ref(false);
const uploadingImage = ref(false);
const tagInput = ref('');

const postForm = ref<Post>({
  id: undefined,
  title: '',
  content: '',
  categoryId: 1,
  tags: [],
});

const renderedContent = computed(() => {
  return marked.parse(postForm.value.content || '');
});

const addTag = () => {
  const val = tagInput.value.trim();
  if (!val) return;
  if (postForm.value.tags.includes(val)) {
    Message.warning('标签已存在');
    tagInput.value = '';
    return;
  }
  postForm.value = {
    ...postForm.value,
    tags: [...postForm.value.tags, val],
  };
  tagInput.value = '';
  tagInputRef.value?.focus();
};

const removeTag = (idx: number) => {
  postForm.value = {
    ...postForm.value,
    tags: postForm.value.tags.filter((_, i) => i !== idx),
  };
};

const triggerImageUpload = () => {
  imageInputRef.value?.click();
};

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploadingImage.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await postApi.uploadPostImage(formData);
    if (response.code === 200 && response.data?.url) {
      const imageUrl = response.data.url;
      const markdownImageSyntax = `\n![图片描述](/uploads/${imageUrl})\n`;

      const textarea = contentTextareaRef.value;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const content = postForm.value.content;
        const newContent =
          content.substring(0, start) +
          markdownImageSyntax +
          content.substring(end);
        postForm.value = { ...postForm.value, content: newContent };
        Message.success('图片上传成功，已插入到编辑器');
      }
    } else {
      Message.error(response.message || '图片上传失败');
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    Message.error('图片上传失败');
  } finally {
    uploadingImage.value = false;
    if (target) {
      target.value = '';
    }
  }
};

const submitForm = async () => {
  try {
    await formRef.value.validate();
  } catch {
    Message.error('请完善表单信息');
    return;
  }

  submitting.value = true;
  try {
    const requestData: PostCreateRequest = {
      title: postForm.value.title,
      content: postForm.value.content,
      categoryId: postForm.value.categoryId,
      tags: postForm.value.tags.join(','),
    };
    const response = await postApi.createPost(requestData);
    if (response.code === 200) {
      Message.success('文章发布成功');
      router.push(`/post/${response.data.id}`);
    } else {
      Message.error(response.message || '发布失败');
    }
  } catch (error) {
    console.error('发布文章失败:', error);
    Message.error('发布文章失败');
  } finally {
    submitting.value = false;
  }
};

const saveDraft = async () => {
  try {
    await formRef.value.validate();
  } catch {
    Message.error('请完善表单信息');
    return;
  }

  savingDraft.value = true;
  try {
    const requestData: PostCreateRequest = {
      title: postForm.value.title,
      content: postForm.value.content,
      categoryId: postForm.value.categoryId,
      tags: postForm.value.tags.join(','),
    };
    const response = await postApi.savePostDraft(requestData);
    if (response.code === 200) {
      Message.success('草稿保存成功');
      router.push(`/post/${response.data.id}`);
    } else {
      Message.error(response.message || '保存草稿失败');
    }
  } catch (error) {
    console.error('保存草稿失败:', error);
    Message.error('保存草稿失败');
  } finally {
    savingDraft.value = false;
  }
};

const cancel = () => {
  router.go(-1);
};
</script>
