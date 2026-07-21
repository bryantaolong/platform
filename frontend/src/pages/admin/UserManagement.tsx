import { useEffect, useState, useCallback } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Message,
} from '@arco-design/web-react'
import {
  IconPlus,
  IconDownload,
} from '@arco-design/web-react/icon'
import * as userApi from '@/api/user/user.ts'
import * as userExportApi from '@/api/user/userExport.ts'
import * as userRoleApi from '@/api/user/userRole.ts'
import * as userProfileApi from '@/api/user/userProfile.ts'
import type { SysUser } from '@/models/entity/user'
import type { UserCreateRequest } from '@/models/request/user'
import type { UserRoleOptionVO } from '@/models/vo/user'
import type { UserProfileVO } from '@/models/vo/user'
import UserSearchForm from '@/components/admin/UserSearchForm'
import UserTable from '@/components/admin/UserTable'
import UserFormDialog from '@/components/admin/UserFormDialog'
import UserDetailDialog from '@/components/admin/UserDetailDialog'

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

const UserManagement = () => {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userList, setUserList] = useState<SysUser[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [searchFormData, setSearchFormData] = useState<UserSearchFormData>(defaultSearchForm)

  const [dialogVisible, setDialogVisible] = useState(false)
  const [detailDialogVisible, setDetailDialogVisible] = useState(false)
  const [dialogType, setDialogType] = useState<'add' | 'edit'>('add')

  const [userForm, setUserForm] = useState<UserFormData>(defaultUserForm)
  const [currentUser, setCurrentUser] = useState<SysUser | null>(null)
  const [roleOptions, setRoleOptions] = useState<UserRoleOptionVO[]>([])

  const [searchFormRef] = Form.useForm()
  const [userFormRef] = Form.useForm()

  const loadRoleOptions = async () => {
    if (roleOptions.length > 0) return
    const res = await userRoleApi.listRoles()
    if (res.code === 200) {
      setRoleOptions(res.data)
    }
  }

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

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const searchParams: Record<string, any> = {}
      if (searchFormData.username) searchParams.username = searchFormData.username
      if (searchFormData.phone) searchParams.phone = searchFormData.phone
      if (searchFormData.email) searchParams.email = searchFormData.email
      if (searchFormData.status) searchParams.status = searchFormData.status

      const res = await userApi.queryUsers(searchParams, pageNum, pageSize)

      if (res.code === 200) {
        setUserList(res.data.rows)
        setTotal(res.data.total)
      } else {
        Message.error(res.message || '加载用户列表失败')
      }
    } catch (error) {
      Message.error('加载用户列表失败')
      console.error('Load users error:', error)
    } finally {
      setLoading(false)
    }
  }, [searchFormData, pageNum, pageSize])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSearch = (data: UserSearchFormData) => {
    setSearchFormData(data)
    setPageNum(1)
  }

  const handleReset = () => {
    setSearchFormData(defaultSearchForm)
    setPageNum(1)
  }

  const handleSizeChange = (size: number) => {
    setPageSize(size)
    setPageNum(1)
  }

  const handleCurrentChange = (page: number) => {
    setPageNum(page)
  }

  const handleAddUser = () => {
    setDialogType('add')
    setUserForm(defaultUserForm)
    setDialogVisible(true)
  }

  const handleEdit = async (user: SysUser) => {
    setDialogType('edit')
    setCurrentUser(user)

    setUserForm({
      username: user.username || '',
      phone: user.phone || '',
      email: user.email || '',
      realName: '',
      gender: '',
      birthday: '',
      avatar: '',
      password: '',
      roleIds: [],
    })

    await loadRoleOptions()
    const roleNames = user.roles ? user.roles.split(',').map(r => r.trim()).filter(Boolean) : []
    const roleIds = roleOptions
      .filter(o => roleNames.includes(o.roleName))
      .map(o => o.id)
    setUserForm(prev => ({ ...prev, roleIds }))
    setDialogVisible(true)
  }

  const handleView = async (user: SysUser) => {
    try {
      const res = await userProfileApi.getUserProfileByUserId(user.id)
      if (res.code === 200) {
        const profile: UserProfileVO = res.data
        setCurrentUser({ ...user, ...profile })
        setDetailDialogVisible(true)
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
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>请输入新密码：</p>
          <Input.Password
            placeholder="密码至少6位"
            onChange={(value) => { newPassword = value }}
          />
        </div>
      ),
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
          if (userList.length === 1 && pageNum > 1) {
            setPageNum(prev => prev - 1)
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
      setSubmitting(true)
      if (dialogType === 'add') {
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
          setDialogVisible(false)
          loadUsers()
        } else {
          Message.error(res.message || '新增失败')
        }
      } else {
        if (!currentUser) {
          Message.error('用户信息不存在')
          return
        }
        const updateRes = await userApi.updateUser(currentUser.id, formData)
        if (updateRes.code !== 200) {
          Message.error(updateRes.message || '更新失败')
          return
        }

        if (formData.roleIds && formData.roleIds.length > 0) {
          const roleRes = await userApi.changeUserRoles(currentUser.id, formData.roleIds)
          if (roleRes.code !== 200) {
            Message.error(roleRes.message || '角色更新失败')
            return
          }
        }

        Message.success('更新成功')
        setDialogVisible(false)
        loadUsers()
      }
    } catch (error) {
      console.error('Submit user error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDialogClose = () => {
    setCurrentUser(null)
    setUserForm(defaultUserForm)
    userFormRef.resetFields()
  }

  const handleExportAllUsers = () => {
    let fileName = ''
    Modal.confirm({
      title: '导出所有用户',
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>请输入导出文件名:</p>
          <Input
            defaultValue="所有用户数据"
            placeholder="文件名不能为空"
            onChange={(value) => { fileName = value }}
          />
        </div>
      ),
      onOk: async () => {
        const finalName = fileName || '所有用户数据'
        await userExportApi.exportAllUsers(finalName, mapStatusToCode(searchFormData.status))
        Message.success('所有用户数据已开始导出！')
      },
    })
  }

  return (
    <div className="user-management-container">
      <Card className="main-card">
        <div className="card-header">
          <span>用户管理</span>
          <div className="button-group">
            <Button type="primary" icon={<IconPlus />} onClick={handleAddUser}>
              新增用户
            </Button>
            <Button icon={<IconDownload />} onClick={handleExportAllUsers}>
              导出用户
            </Button>
          </div>
        </div>

        {/* Search Form */}
        <Card className="search-card">
          <UserSearchForm
            form={searchFormRef}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </Card>

        {/* Table */}
        <UserTable
          loading={loading}
          data={userList}
          total={total}
          pageNum={pageNum}
          pageSize={pageSize}
          onPageChange={handleCurrentChange}
          onPageSizeChange={handleSizeChange}
          onEdit={handleEdit}
          onView={handleView}
          onResetPassword={handleResetPassword}
          onBlock={handleBlockUser}
          onUnblock={handleUnblockUser}
          onDelete={handleDeleteUser}
        />
      </Card>

      {/* Form Dialog */}
      <UserFormDialog
        visible={dialogVisible}
        type={dialogType}
        form={userFormRef}
        roleOptions={roleOptions}
        submitting={submitting}
        initialValues={userForm}
        onSubmit={handleSubmit}
        onClose={() => { setDialogVisible(false); handleDialogClose() }}
      />

      {/* Detail Dialog */}
      <UserDetailDialog
        visible={detailDialogVisible}
        user={currentUser}
        onClose={() => setDetailDialogVisible(false)}
      />
    </div>
  )
}

export default UserManagement
