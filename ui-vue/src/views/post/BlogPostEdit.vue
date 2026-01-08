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

        <!-- 仍用旧输入框，保持用户习惯 -->
        <el-form-item label="标签" prop="tags">
          <el-input
              v-model="tagsString"
              placeholder="例如：技术,前端,Vue"
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
            更新文章
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postApi } from '@/api/post'
import type { Post } from '@/models/entity/post/Post'
import type { PostUpdateRequest } from '@/models/request/post/PostUpdateRequest'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)
const postId = Number(route.params.id)

/* 表单 */
const postForm = reactive<Post>({
  id: undefined,
  title: '',
  content: '',
  categoryId: 1,
  tags: [],
})

/* 双向绑定：数组 ↔ 逗号字符串 */
const tagsString = computed({
  get: () => postForm.tags.join(','),
  set: (val: string) => {
    postForm.tags = val
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
  }
})

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

/* 加载文章 */
const loadPost = async () => {
  if (!postId || !Number.isFinite(postId)) {
    ElMessage.error('文章ID不存在')
    return
  }

  loading.value = true
  try {
    const response = await postApi.getPostById(postId)
    if (response.code === 200) {
      const data = response.data
      postForm.id = data.id
      postForm.title = data.title
      postForm.content = data.content
      postForm.categoryId = data.categoryId || 1
      postForm.tags = Array.isArray(data.tags) ? data.tags : []
    } else {
      ElMessage.error(response.message || '获取文章失败')
    }
  } catch (error) {
    console.error('获取文章失败:', error)
    ElMessage.error('获取文章失败')
  } finally {
    loading.value = false
  }
}

/* 提交更新 */
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        const requestData: PostUpdateRequest = {
          title: postForm.title,
          content: postForm.content,
          categoryId: postForm.categoryId,
          tags: postForm.tags,
          weight: 1
        }

        const response = await postApi.updatePost(postId, requestData)
        if (response.code === 200) {
          ElMessage.success('文章更新成功')
          router.push(`/post/${postId}`)
        } else {
          ElMessage.error(response.message || '更新失败')
        }
      } catch (error) {
        console.error('更新文章失败:', error)
        ElMessage.error('更新文章失败')
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

onMounted(() => {
  const postId = Number(route.params.id)
  if (!postId || !Number.isFinite(postId)) {
    ElMessage.error('非法文章ID')
    router.replace('/404')
  }

  loadPost()
})
</script>

<style scoped>
.blog-post-edit-container {
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