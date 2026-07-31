<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Message,
} from '@arco-design/web-vue'
import {
  IconPlus,
  IconDownload,
} from '@arco-design/web-vue/es/icon'
import * as userApi from '@/api/user/user.ts'
import * as userExportApi from '@/api/user/userExport.ts'
import * as userRoleApi from '@/api/user/userRole.ts'
import * as userProfileApi from '@/api/user/userProfile.ts'
import type { SysUser } from '@/models/entity/user'
import type { UserCreateRequest } from '@/models/request/user'
import type { UserRoleOptionVO } from '@/models/vo/user'
import type { UserProfileVO } from '@/models/vo/user'
import UserSearchForm from '@/components/admin/UserSearchForm.vue'
import UserTable from '@/components/admin/UserTable.vue'
import UserFormDialog from '@/components/admin/UserFormDialog.vue'
import UserDetailDialog from '@/components/admin/UserDetailDialog.vue'

type UserStatus = 'NORMAL' | 'LOCKED' | 'BANNED' | ''

interface UserSearchFormData {
  username: string
  phone: string
  email: string
  status: UserStatus
}

interface UserFormData {
  username?: string
  phone?: string
  email?: string
  realName?: string
  gender?: string
  birthday?: string
  avatar?: string
  password?: string
  roleIds?: number[]
}

const defaultSearchForm: UserSearchFormData = {
  username: '',
  phone: '',
  email: '',
  status: '',
}

const defaultUserForm: UserFormData = {
  username: '',
  phone: '',
  email: '',
  realName: '',
  gender: '',
  birthday: '',
  avatar: '',
  password: '',
  roleIds: [],
}

const loading = ref(false)
const submitting = ref(false)
const userList = ref<SysUser[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const searchFormData = ref<UserSearchFormData>({ ...defaultSearchForm })

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

const userForm = ref<UserFormData>({ ...defaultUserForm })
const currentUser = ref<SysUser | null>(null)
const roleOptions = ref<UserRoleOptionVO[]>([])

const searchFormRef = Form.useForm()
const userFormRef = Form.useForm()

const mapStatusToCode = (status: UserStatus): number | undefined => {
  if (!status) return undefined
  switch (status) {
    case 'NORMAL':
      return 0
    case 'BANNED':
      return 1
    case 'LOCKED':
      return 2
    default:
      return undefined
  }
}

const loadRoleOptions = async () => {
  if (roleOptions.value.length > 0) return
  const res = await userRoleApi.listRoles()
  if (res.code === 200) {
    roleOptions.value = res.data
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const searchParams: Record<string, any> = {}
    if (searchFormData.value.username) searchParams.username = searchFormData.value.username
    if (searchFormData.value.phone) searchParams.phone = searchFormData.value.phone
    if (searchFormData.value.email) searchParams.email = searchFormData.value.email
    if (searchFormData.value.status) searchParams.status = searchFormData.value.status

    const res = await userApi.queryUsers(searchParams, pageNum.value, pageSize.value)

    if (res.code === 200) {
      userList.value = res.data.rows
      total.value = res.data.total
    } else {
      Message.error(res.message || '加载用户列表失败')
    }
  } catch (error) {
    Message.error('加载用户列表失败')
    console.error('Load users error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
})

const handleSearch = (data: UserSearchFormData) => {
  searchFormData.value = data
  pageNum.value = 1
}

const handleReset = () => {
  searchFormData.value = { ...defaultSearchForm }
  pageNum.value = 1
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
}

const handleAddUser = () => {
  dialogType.value = 'add'
  userForm.value = { ...defaultUserForm }
  dialogVisible.value = true
}

const handleEdit = async (user: SysUser) => {
  dialogType.value = 'edit'
  currentUser.value = user

  userForm.value = {
    username: user.username || '',
    phone: user.phone || '',
    email: user.email || '',
    realName: '',
    gender: '',
    birthday: '',
    avatar: '',
    password: '',
    roleIds: [],
  }

  await loadRoleOptions()
  const roleNames = user.roles ? user.roles.split(',').map(r => r.trim()).filter(Boolean) : []
  const roleIds = roleOptions.value
    .filter(o => roleNames.includes(o.roleName))
    .map(o => o.id)
  userForm.value = { ...userForm.value, roleIds }
  dialogVisible.value = true
}

const handleView = async (user: SysUser) => {
  try {
    const res = await userProfileApi.getUserProfileByUserId(user.id)
    if (res.code === 200) {
      const profile: UserProfileVO = res.data
      currentUser.value = { ...user, ...profile }
      detailDialogVisible.value = true
    } else {
      Message.error(res.message || '获取用户详情失败')
    }
  } catch (error) {
    Message.error('获取用户详情失败')
    console.error('View user error:', error)
  }
}

const handleResetPassword = (user: SysUser) => {
  let newPassword = ''
  Modal.confirm({
    title: '重置密码',
    content: () => h('div', {}, [
      h('p', { style: { marginBottom: 8 } }, '请输入新密码：'),
      h(Input.Password, {
        placeholder: '密码至少6位',
        onChange: (value: string) => { newPassword = value }
      })
    ]),
    onOk: async () => {
      if (!newPassword || newPassword.length < 6) {
        Message.error('密码至少6位')
        return Promise.reject()
      }
      const res = await userApi.resetPassword(user.id, newPassword)
      if (res.code === 200) {
        Message.success('密码重置成功')
      } else {
        Message.error(res.message || '密码重置失败')
      }
    },
  })
}

const handleBlockUser = (user: SysUser) => {
  Modal.confirm({
    title: '警告',
    content: `确定要封禁用户 "${user.username}" 吗？`,
    okButtonProps: { status: 'warning' },
    onOk: async () => {
      const res = await userApi.blockUser(user.id)
      if (res.code === 200) {
        Message.success('用户已封禁')
        loadUsers()
      } else {
        Message.error(res.message || '封禁失败')
      }
    },
  })
}

const handleUnblockUser = (user: SysUser) => {
  Modal.confirm({
    title: '提示',
    content: `确定要解封用户 "${user.username}" 吗？`,
    onOk: async () => {
      const res = await userApi.unblockUser(user.id)
      if (res.code === 200) {
        Message.success('用户已解封')
        loadUsers()
      } else {
        Message.error(res.message || '解封失败')
      }
    },
  })
}

const handleDeleteUser = (user: SysUser) => {
  Modal.confirm({
    title: '危险操作',
    content: `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      const res = await userApi.deleteUser(user.id)
      if (res.code === 200) {
        Message.success('用户已删除')
        if (userList.value.length === 1 && pageNum.value > 1) {
          pageNum.value = pageNum.value - 1
        } else {
          loadUsers()
        }
      } else {
        Message.error(res.message || '删除失败')
      }
    },
  })
}

const handleSubmit = async () => {
  try {
    const formData = await userFormRef.validate()
    submitting.value = true
    if (dialogType.value === 'add') {
      const payload: UserCreateRequest = {
        username: formData.username || '',
        password: formData.password || '',
        phone: formData.phone,
        email: formData.email,
        roleIds: formData.roleIds,
      }
      const res = await userApi.createUser(payload)
      if (res.code === 200) {
        Message.success('新增用户成功')
        dialogVisible.value = false
        loadUsers()
      } else {
        Message.error(res.message || '新增失败')
      }
    } else {
      if (!currentUser.value) {
        Message.error('用户信息不存在')
        return
      }
      const updateRes = await userApi.updateUser(currentUser.value.id, formData)
      if (updateRes.code !== 200) {
        Message.error(updateRes.message || '更新失败')
        return
      }

      if (formData.roleIds && formData.roleIds.length > 0) {
        const roleRes = await userApi.changeUserRoles(currentUser.value.id, formData.roleIds)
        if (roleRes.code !== 200) {
          Message.error(roleRes.message || '角色更新失败')
          return
        }
      }

      Message.success('更新成功')
      dialogVisible.value = false
      loadUsers()
    }
  } catch (error) {
    console.error('Submit user error:', error)
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  currentUser.value = null
  userForm.value = { ...defaultUserForm }
  userFormRef.resetFields()
}

const handleExportAllUsers = () => {
  let fileName = ''
  Modal.confirm({
    title: '导出所有用户',
    content: () => h('div', {}, [
      h('p', { style: { marginBottom: 8 } }, '请输入导出文件名:'),
      h(Input, {
        defaultValue: '所有用户数据',
        placeholder: '文件名不能为空',
        onChange: (value: string) => { fileName = value }
      })
    ]),
    onOk: async () => {
      const finalName = fileName || '所有用户数据'
      await userExportApi.exportAllUsers(finalName, mapStatusToCode(searchFormData.value.status))
      Message.success('所有用户数据已开始导出！')
    },
  })
}
</script>

<template>
  <div class="user-management-container">
    <Card class="main-card">
      <div class="card-header">
        <span>用户管理</span>
        <div class="button-group">
          <Button type="primary" @click="handleAddUser">
            <template #icon><IconPlus /></template>
            新增用户
          </Button>
          <Button @click="handleExportAllUsers">
            <template #icon><IconDownload /></template>
            导出用户
          </Button>
        </div>
      </div>

      <!-- Search Form -->
      <Card class="search-card">
        <UserSearchForm
          :form="searchFormRef"
          @search="handleSearch"
          @reset="handleReset"
        />
      </Card>

      <!-- Table -->
      <UserTable
        :loading="loading"
        :data="userList"
        :total="total"
        :page-num="pageNum"
        :page-size="pageSize"
        @page-change="handleCurrentChange"
        @page-size-change="handleSizeChange"
        @edit="handleEdit"
        @view="handleView"
        @reset-password="handleResetPassword"
        @block="handleBlockUser"
        @unblock="handleUnblockUser"
        @delete="handleDeleteUser"
      />
    </Card>

    <!-- Form Dialog -->
    <UserFormDialog
      :visible="dialogVisible"
      :type="dialogType"
      :form="userFormRef"
      :role-options="roleOptions"
      :submitting="submitting"
      :initial-values="userForm"
      @submit="handleSubmit"
      @close="() => { dialogVisible = false; handleDialogClose() }"
    />

    <!-- Detail Dialog -->
    <UserDetailDialog
      :visible="detailDialogVisible"
      :user="currentUser"
      @close="() => detailDialogVisible = false"
    />
  </div>
</template>

<style scoped>
.user-management-container {
  padding: 20px;
}
</style>
