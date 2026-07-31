<template>
  <div class="blog-post-edit-container">
    <Card class="form-card">
      <div class="card-header">
        <span>编辑博客文章</span>
      </div>

      <Spin :loading="loading" style="width: 100%">
        <Form ref="formRef" :model="postForm" layout="vertical" size="large" class="post-form">
          <Form.Item
            label="标题"
            field="title"
            :rules="[
              { required: true, message: '请输入文章标题' },
              { minLength: 1, maxLength: 100, message: '标题长度应在1-100个字符之间' },
            ]"
          >
            <Input
              placeholder="请输入文章标题"
              max-length="100"
              show-word-limit
              @change="(val) => handleFieldChange('title', val)"
            />
          </Form.Item>

          <Form.Item
            label="分类"
            field="categoryId"
            :rules="[{ required: true, message: '请选择分类' }]"
          >
            <Select
              placeholder="请选择分类"
              @change="(value) => handleFieldChange('categoryId', value)"
            >
              <a-option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </a-option>
            </Select>
          </Form.Item>

          <Form.Item label="标签" field="tags">
            <div class="tags">
              <a-tag
                v-for="tag in postForm.tags"
                :key="tag"
                size="small"
                color="gray"
              >
                {{ tag }}
              </a-tag>
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
                  placeholder="请输入文章内容（支持 Markdown）"
                  :rows="20"
                  :style="{
                    height: '100%',
                    border: 'none',
                    resize: 'none',
                    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, monospace',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }"
                  @change="(value) => handleFieldChange('content', value)"
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
              style="margin-right: 12"
            >
              更新文章
            </a-button>
            <a-button @click="cancel">取消</a-button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marked } from 'marked';
import { Form, Input, Button, Select, Tag, Card, Message, Spin } from '@arco-design/web-vue';
import { useUserStore } from '@/stores/user';
import './PostEdit.css';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const [formRef] = Form.useForm<Post>();

const categoryOptions = [
  { label: '技术分享', value: 1 },
  { label: '生活感悟', value: 2 },
  { label: '读书笔记', value: 3 },
  { label: '其他', value: 4 },
];

const postId = computed(() => Number(route.params.id));
const loading = ref(false);
const submitting = ref(false);
const uploadingImage = ref(false);
const imageInputRef = ref<HTMLInputElement | null>(null);
const contentTextareaRef = ref<InstanceType<typeof Input.TextArea> | null>(null);

const postForm = ref<Post>({
  id: undefined,
  title: '',
  content: '',
  categoryId: 1,
  tags: [],
});

const canManagePost = (userId?: number) => {
  if (!userId || !userStore.userInfo) {
    return false;
  }
  return (
    userStore.userInfo.id === userId || userStore.isAdmin || userStore.isModerator
  );
};

const renderedContent = computed(() => {
  return marked.parse(postForm.value.content || '') as string;
});

const loadPost = async () => {
  loading.value = true;
  try {
    const response = await postApi.getPostById(postId.value);
    if (response.code === 200) {
      const data = response.data;
      if (!canManagePost(data.userId)) {
        Message.error('您没有权限编辑这篇文章');
        router.push(`/post/${postId.value}`, { replace: true });
        return;
      }
      postForm.value = {
        ...postForm.value,
        id: data.id,
        title: data.title,
        content: data.content,
        categoryId: data.categoryId || 1,
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
    } else {
      Message.error(response.message || '获取文章失败');
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    Message.error('获取文章失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPost();
});

const handleFieldChange = (field: string, value: any) => {
  postForm.value = {
    ...postForm.value,
    [field]: value,
  };
};

const submitForm = async () => {
  try {
    await formRef.validate();
  } catch {
    Message.error('请完善表单信息');
    return;
  }
  submitting.value = true;
  try {
    const requestData: PostUpdateRequest = {
      title: postForm.value.title,
      content: postForm.value.content,
      categoryId: postForm.value.categoryId,
      tags: postForm.value.tags as any,
    };
    const response = await postApi.updatePost(postId.value, requestData);
    if (response.code === 200) {
      Message.success('文章更新成功');
      router.push(`/post/${postId.value}`);
    } else {
      Message.error(response.message || '更新失败');
    }
  } catch (error) {
    console.error('更新文章失败:', error);
    Message.error('更新文章失败');
  } finally {
    submitting.value = false;
  }
};

const cancel = () => {
  router.back();
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
      const textarea = contentTextareaRef.value?.$el?.querySelector('textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const content = postForm.value.content;
        const newContent =
          content.substring(0, start) + markdownImageSyntax + content.substring(end);
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
    target.value = '';
  }
};
</script>
