<template>
  <div class="blog-post-edit-container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>编辑博客文章</span>
        </div>
      </template>

      <el-form
          :model="postForm"
          :rules="formRules"
          ref="formRef"
          label-width="100px"
          v-loading="loading"
      >
        <el-form-item label="标题" prop="title">
          <el-input
              v-model="postForm.title"
              placeholder="请输入文章标题"
              maxlength="100"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select
              v-model="postForm.categoryId"
              placeholder="请选择分类"
              style="width: 100%"
          >
            <el-option label="技术分享" :value="1" />
            <el-option label="生活感悟" :value="2" />
            <el-option label="读书笔记" :value="3" />
            <el-option label="其他" :value="4" />
          </el-select>
        </el-form-item>

        <!-- 标签：即时添加/删除 -->
        <el-form-item label="标签" prop="tags">
          <div style="width: 100%;">
            <div style="margin-bottom: 6px; min-height: 32px;">
              <el-tag
                  v-for="(tag, idx) in postForm.tags"
                  :key="tag"
                  closable
                  @close="removeTag(idx)"
                  style="margin-right: 6px; margin-bottom: 6px;"
              >
                {{ tag }}
              </el-tag>
            </div>
            <el-input
                ref="tagInputRef"
                v-model="tagInput"
                placeholder="输入标签后回车或失焦即可添加"
                style="width: 100%"
                @keyup.enter="addTag"
                @blur="addTag"
            />
          </div>
        </el-form-item>

        <el-form-item label="内容" prop="content">
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
                <el-button
                    type="primary"
                    size="small"
                    @click="triggerImageUpload"
                    :loading="uploadingImage"
                >
                  <template #icon>📷</template>
                  上传图片
                </el-button>
                <span class="hint-text">选择图片后自动插入到光标位置</span>
              </div>
              <el-input
                  v-model="postForm.content"
                  :rows="20"
                  type="textarea"
                  placeholder="请输入文章内容（支持 Markdown）"
                  ref="contentTextareaRef"
              />
            </div>
            <div class="preview-pane markdown-body" v-html="renderedContent"></div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              @click="submitForm"
              :loading="submitting"
          >
            发布文章
          </el-button>
          <el-button
              type="success"
              @click="saveDraft"
              :loading="savingDraft"
          >
            保存草稿
          </el-button>
          <el-button @click="cancel">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElInput, ElMessage } from 'element-plus'
import * as postApi from '@/api/post/post.ts'
import type { Post } from '@/models/entity/post'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)
const savingDraft = ref(false)
const uploadingImage = ref(false)
const imageInputRef = ref<HTMLInputElement>()
const contentTextareaRef = ref<InstanceType<typeof ElInput>>()

/* Computed property for rendered markdown content */
const renderedContent = computed(() => {
  return marked.parse(postForm.content || '')
})

/* 表单 */
const postForm = reactive<Post>({
  id: undefined,
  title: '',
  content: '',
  categoryId: 1,
  tags: [],
})

/* 标签输入临时值 */
const tagInput = ref<string>('')
const tagInputRef = ref<InstanceType<typeof ElInput>>()

/* 校验规则 */
const formRules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度应在1-100个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' },
    { min: 10, message: '文章内容至少需要10个字符', trigger: 'blur' }
  ]
}

/* 添加标签 */
const addTag = () => {
  const val = tagInput.value.trim()
  if (!val) return
  if (postForm.tags.includes(val)) {
    ElMessage.warning('标签已存在')
    tagInput.value = ''
    return
  }
  postForm.tags.push(val)
  tagInput.value = ''
  tagInputRef.value?.focus()
}

/* 删除标签 */
const removeTag = (idx: number) => {
  postForm.tags.splice(idx, 1)
}

/* 触发图片上传选择 */
const triggerImageUpload = () => {
  imageInputRef.value?.click()
}

/* 处理图片上传 */
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadingImage.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await postApi.uploadPostImage(formData)
    if (response.code === 200 && response.data?.url) {
      const imageUrl = response.data.url
      // 插入 Markdown 图片语法，使用完整的相对路径（包含 /uploads/ 前缀）
      const markdownImageSyntax = `
![图片描述](/uploads/${imageUrl})
`

      const textarea = contentTextareaRef.value?.$el.querySelector('textarea') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const content = postForm.content
        postForm.content = content.substring(0, start) + markdownImageSyntax + content.substring(end)
        ElMessage.success('图片上传成功，已插入到编辑器')
      }
    } else {
      ElMessage.error(response.message || '图片上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
  } finally {
    uploadingImage.value = false
    if (target) {
      target.value = ''
    }
  }
}

/* 提交发布 */
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        const response = await postApi.createPost({
          title: postForm.title,
          content: postForm.content,
          categoryId: postForm.categoryId,
          tags: postForm.tags
        })
        if (response.code === 200) {
          ElMessage.success('文章发布成功')
          router.push(`/post/${response.data.id}`)
        } else {
          ElMessage.error(response.message || '发布失败')
        }
      } catch (error) {
        console.error('发布文章失败:', error)
        ElMessage.error('发布文章失败')
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.error('请完善表单信息')
    }
  })
}

/* 取消 */
const cancel = () => {
  router.go(-1)
}

/* 保存草稿 */
const saveDraft = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      savingDraft.value = true
      try {
        const response = await postApi.savePostDraft({
          title: postForm.title,
          content: postForm.content,
          categoryId: postForm.categoryId,
          tags: postForm.tags
        })
        if (response.code === 200) {
          ElMessage.success('草稿保存成功')
          router.push(`/post/${response.data.id}`)
        } else {
          ElMessage.error(response.message || '保存草稿失败')
        }
      } catch (error) {
        console.error('保存草稿失败:', error)
        ElMessage.error('保存草稿失败')
      } finally {
        savingDraft.value = false
      }
    } else {
      ElMessage.error('请完善表单信息')
    }
  })
}

onMounted(() => {
})
</script>

<style scoped>
.blog-post-edit-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 120px);
}

.markdown-editor {
  display: flex;
  gap: 20px;
  width: 100%;
  height: 600px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.editor-toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint-text {
  font-size: 12px;
  color: #909399;
}

.editor-pane, .preview-pane {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 10px;
}

.editor-pane {
  border-right: 1px solid #ebeef5;
}

.editor-pane :deep(.el-textarea__inner) {
  height: 100% !important;
  border: none;
  resize: none;
  padding: 0;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
}

.preview-pane {
  background-color: #fcfcfc;
}

/* Markdown Styles (Soft & Intuitive) */
.markdown-body {
  color: #24292f;
  font-size: 15px;
  line-height: 1.6;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
  color: #1f2328;
}

.markdown-body :deep(h1) { font-size: 1.8em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-body :deep(h2) { font-size: 1.4em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }

.markdown-body :deep(p) { margin-bottom: 1em; }

.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 85%;
}

.markdown-body :deep(pre) {
  padding: 16px;
  background-color: #f6f8fa;
  border-radius: 8px;
  margin-bottom: 1em;
  overflow: auto;
}

.markdown-body :deep(blockquote) {
  padding: 0 1em;
  color: #656d76;
  border-left: 0.25em solid #d0d7de;
  margin: 0 0 1em 0;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 8px 12px;
  border: 1px solid #d0d7de;
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.form-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  font-weight: 600;
  font-size: 18px;
}
</style>