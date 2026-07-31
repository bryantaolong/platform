<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Pagination,
  Message,
  Modal,
} from '@arco-design/web-vue'
import {
  IconSearch,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconCheck,
} from '@arco-design/web-vue/es/icon'
import type { TableColumn } from '@arco-design/web-vue/es/table/interface'
import * as postApi from '@/api/post/post'
import { PostStatusEnum } from '@/models/enum'
import type { PostVO } from '@/models/vo/post'
import './PostManagement.css'

const statusOptions = [
  { label: '已发布', value: PostStatusEnum.PUBLISHED },
  { label: '审核中', value: PostStatusEnum.AUDITING },
  { label: '草稿', value: PostStatusEnum.DRAFT },
  { label: '私有', value: PostStatusEnum.PRIVATE },
  { label: '回收站', value: PostStatusEnum.RECYCLED },
]

const getStatusType = (status: PostStatusEnum): string => {
  switch (status) {
    case PostStatusEnum.PUBLISHED:
      return 'green'
    case PostStatusEnum.AUDITING:
      return 'blue'
    case PostStatusEnum.DRAFT:
      return 'gray'
    case PostStatusEnum.PRIVATE:
      return 'orange'
    case PostStatusEnum.RECYCLED:
      return 'red'
    default:
      return 'gray'
  }
}

const getStatusLabel = (status: PostStatusEnum): string => {
  switch (status) {
    case PostStatusEnum.PUBLISHED:
      return '已发布'
    case PostStatusEnum.AUDITING:
      return '审核中'
    case PostStatusEnum.DRAFT:
      return '草稿'
    case PostStatusEnum.PRIVATE:
      return '私有'
    case PostStatusEnum.RECYCLED:
      return '回收站'
    default:
      return status
  }
}

const formatDate = (date: string): string => {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const router = useRouter()

const loading = ref(false)
const postList = ref<PostVO[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const searchForm = ref({
  title: '',
  author: '',
  status: undefined as PostStatusEnum | undefined,
})

const loadPosts = async () => {
  loading.value = true
  try {
    const res = await postApi.queryPosts(
      {
        title: searchForm.value.title,
        author: searchForm.value.author,
        tags: '',
        status: searchForm.value.status,
      },
      pageNum.value,
      pageSize.value
    )
    if (res.code === 200) {
      postList.value = res.data.rows
      total.value = res.data.total
    } else {
      Message.error(res.message || '加载博文列表失败')
    }
  } catch (error) {
    console.error('Load posts error:', error)
    Message.error('加载博文列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPosts()
})

const handleSearch = () => {
  pageNum.value = 1
}

const handleReset = () => {
  searchForm.value = { title: '', author: '', status: undefined }
  pageNum.value = 1
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
}

const handleView = (row: PostVO) => {
  router.push(`/post/${row.id}`)
}

const handleEdit = (row: PostVO) => {
  router.push(`/post/${row.id}/edit`)
}

const handleAudit = (row: PostVO) => {
  router.push(`/post/${row.id}/audit`)
}

const handleDelete = (row: PostVO) => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除博文 "${row.title}" 吗？此操作不可恢复！`,
    okText: '确定',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      try {
        const res = await postApi.deletePost(row.id)
        if (res.code === 200) {
          Message.success('删除成功')
          loadPosts()
        } else {
          Message.error(res.message || '删除失败')
        }
      } catch (error) {
        console.error('Delete post error:', error)
        Message.error('删除失败')
      }
    },
  })
}

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
    align: 'center',
  },
  {
    title: '标题',
    dataIndex: 'title',
    minWidth: 200,
    ellipsis: true,
    render: ({ row }: { row: PostVO }) => h(Button, { type: 'text', size: 'small', onClick: () => handleView(row) }, () => row.title),
  },
  {
    title: '作者',
    dataIndex: 'author',
    width: 120,
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    align: 'center',
    render: ({ row }: { row: PostVO }) => h(Tag, { color: getStatusType(row.status as PostStatusEnum) }, () => getStatusLabel(row.status as PostStatusEnum)),
  },
  {
    title: '阅读',
    dataIndex: 'viewCount',
    width: 80,
    align: 'center',
  },
  {
    title: '点赞',
    dataIndex: 'likeCount',
    width: 80,
    align: 'center',
  },
  {
    title: '发布时间',
    dataIndex: 'createdAt',
    width: 180,
    align: 'center',
    render: ({ row }: { row: PostVO }) => formatDate(row.createdAt),
  },
  {
    title: '操作',
    width: 220,
    align: 'center',
    fixed: 'right',
    render: ({ row }: { row: PostVO }) => h('div', { style: { display: 'flex', gap: 8, justifyContent: 'center' } }, [
      h(Button, { size: 'small', type: 'primary', onClick: () => handleEdit(row) }, { icon: () => h(IconEdit), default: () => '编辑' }),
      row.status === PostStatusEnum.AUDITING ? h(Button, { size: 'small', type: 'primary', status: 'success', onClick: () => handleAudit(row) }, { icon: () => h(IconCheck), default: () => '审核' }) : null,
      h(Button, { size: 'small', type: 'primary', status: 'danger', onClick: () => handleDelete(row) }, { icon: () => h(IconDelete), default: () => '删除' }),
    ]),
  },
] as TableColumn[]
</script>

<template>
  <div class="post-management">
    <Card class="header-card">
      <div class="header-content">
        <div class="title-section">
          <h2>博文管理</h2>
          <p class="subtitle">管理系统所有博文内容</p>
        </div>
      </div>
    </Card>

    <Card class="search-card">
      <Form layout="inline" class="search-form">
        <Form.Item label="标题">
          <Input
            v-model="searchForm.title"
            placeholder="博文标题"
            allow-clear
            @press-enter="handleSearch"
          />
        </Form.Item>
        <Form.Item label="作者">
          <Input
            v-model="searchForm.author"
            placeholder="作者名"
            allow-clear
            @press-enter="handleSearch"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model="searchForm.status"
            placeholder="全部状态"
            allow-clear
            style="width: 150px"
          >
            <a-option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" @click="handleSearch">
            <template #icon><IconSearch /></template>
            搜索
          </Button>
          <Button @click="handleReset" style="margin-left: 8px">
            <template #icon><IconRefresh /></template>
            重置
          </Button>
        </Form.Item>
      </Form>
    </Card>

    <Card class="table-card">
      <Table
        :loading="loading"
        :columns="columns"
        :data="postList"
        row-key="id"
        border
        stripe
        :pagination="false"
        :scroll="{ x: 1000 }"
      />
      <div class="pagination-container">
        <Pagination
          :current="pageNum"
          :page-size="pageSize"
          :total="total"
          :size-options="[10, 20, 50, 100]"
          show-total
          show-jumper
          @change="handleCurrentChange"
          @page-size-change="handleSizeChange"
        />
      </div>
    </Card>
  </div>
</template>

<style scoped>
.post-management {
  padding: 20px;
}
</style>
