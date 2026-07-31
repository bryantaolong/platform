<script setup lang="ts">
import { ref, useImperativeHandle, forwardRef } from 'vue';
import { Form, Input, Button, Message } from '@arco-design/web-vue';
import { IconCheck, IconClose } from '@arco-design/web-vue/es/icon';
import type { FormInstance } from '@arco-design/web-vue';
import * as commentApi from '@/api/post/postComment';
import type { CommentCreateRequest } from '@/models/request/post';

interface Props {
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

const props = withDefaults(defineProps<Props>(), {
  submitText: '发表评论',
});

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<FormInstance | null>(null);
const submitting = ref(false);
const content = ref('');

const placeholder = computed(() => {
  return props.replyToUsername ? `回复 @${props.replyToUsername}...` : '请输入您的评论...';
});

defineExpose({
  focus: () => {
    const textarea = document.querySelector('.comment-form-textarea textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  },
});

const handleSubmit = async () => {
  if (!content.value.trim()) {
    Message.warning('请输入评论内容');
    return;
  }

  if (content.value.length > 500) {
    Message.warning('评论内容不能超过500字');
    return;
  }

  submitting.value = true;
  try {
    const data: CommentCreateRequest = {
      postId: props.postId,
      parentId: props.parentId,
      replyToUserId: props.replyToUserId,
      content: content.value,
    };

    const response = await commentApi.createComment(data);
    if (response.code === 200) {
      Message.success('评论发表成功');
      content.value = '';
      formRef.value?.resetFields();
      props.onSubmit?.();
      emit('submit');
    } else {
      Message.error(response.message || '发表评论失败');
    }
  } catch (error) {
    console.error('发表评论失败:', error);
    Message.error('发表评论失败');
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  content.value = '';
  formRef.value?.resetFields();
  props.onCancel?.();
  emit('cancel');
};
</script>

<template>
  <div className="comment-form-container">
    <Form ref="formRef" layout="vertical">
      <Form.Item>
        <div v-if="replyToUsername" className="reply-hint">
          回复 <span className="reply-user">@{{ replyToUsername }}</span>
          <Button type="text" size="small" @click="handleCancel">
            <IconClose />
          </Button>
        </div>
        <Input.TextArea
          className="comment-form-textarea"
          v-model="content"
          :rows="4"
          :placeholder="placeholder"
          :max-length="500"
          show-word-limit
          :style="{ resize: 'none' }"
        />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
        >
          <IconCheck />
          {{ submitText }}
        </Button>
        <Button style="margin-left: 8" @click="handleCancel">
          取消
        </Button>
      </Form.Item>
    </Form>
  </div>
</template>

<style scoped>
.comment-form-container {
  /* same styles as original */
}
</style>
