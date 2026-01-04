<template>
  <div class="blog-post-create-container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>新建博客文章</span>
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

        <el-form-item label="作者" prop="author">
          <el-input
            v-model="postForm.author"
            placeholder="请输入作者名称"
            :readonly="true"
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

        <el-form-item label="标签" prop="tags">
          <el-input
            v-model="tagsString"
            placeholder="多个标签请用逗号分隔，例如：技术,前端,Vue"
          />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="postForm.content"
            :rows="15"
            type="textarea"
            placeholder="请输入文章内容"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitForm" 
            :loading="submitting"
          >
            发布文章
          </el-button>
          <el-button @click="saveDraft" :loading="submitting">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { postApi } from '@/api/post'
import type { Post } from '@/models/entity/post/Post'
import type { PostCreateRequest } from '@/models/request/post/PostCreateRequest'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

// 处理标签的双向绑定
const tagsString = computed({
  get: () => Array.isArray(postForm.tags) ? postForm.tags.join(',') : postForm.tags || '',
  set: (value: string) => {
    postForm.tags = value ? value.split(',').map(tag => tag.trim()).filter(tag => tag).join(',') : ''
  }
})

const postForm = reactive<Post>({
  title: '',
  content: '',
  categoryId: 1,
  tags: '',
  author: ''
})

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

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        // Prepare request data using only the fields needed by the API
        const requestData: PostCreateRequest = {
          title: postForm.title,
          content: postForm.content,
          categoryId: postForm.categoryId,
          tags: postForm.tags,
          weight: 1 // Default weight
        }

        await postApi.createPost(requestData)
        ElMessage.success('文章发布成功')
        router.push('/post/list')
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

const saveDraft = async () => {
  if (!formRef.value) return
  
  // Set status to draft
  postForm.status = 'DRAFT'
  
  await formRef.value.validateField(['title', 'content'], (valid: boolean) => {
    if (valid || valid === undefined) {
      submitting.value = true
      try {
        // Prepare request data using only the fields needed by the API
        const requestData: PostCreateRequest = {
          title: postForm.title,
          content: postForm.content,
          categoryId: postForm.categoryId,
          tags: postForm.tags,
          weight: 1 // Default weight
        }

        postApi.createPost(requestData)
        ElMessage.success('草稿保存成功')
        router.push('/post/list')
      } catch (error) {
        console.error('保存草稿失败:', error)
        ElMessage.error('保存草稿失败')
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.error('请完善表单信息')
    }
  })
}

const cancel = () => {
  router.go(-1) // Go back to previous page
}

onMounted(() => {
  // In a real implementation, we would get the current user's information
  // For now, we'll use a mock value
  postForm.author = '当前用户' // TODO 替换为 user store 中当前用户信息中的用户名
})
</script>

<style scoped>
.blog-post-create-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 0 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 120px);
}

.form-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  font-weight: 600;
  font-size: 18px;
}
</style>