import { Modal, Form, Input, Select } from '@arco-design/web-react'
import type { FormInstance } from '@arco-design/web-react'
import type { UserRoleOptionVO } from '@/models/vo/user'

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

interface UserFormDialogProps {
  visible: boolean
  type: 'add' | 'edit'
  form: FormInstance
  roleOptions: UserRoleOptionVO[]
  submitting?: boolean
  initialValues?: UserFormData
  onSubmit: () => void
  onClose: () => void
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  visible,
  type,
  form,
  roleOptions,
  submitting = false,
  initialValues,
  onSubmit,
  onClose,
}) => {
  return (
    <Modal
      title={type === 'add' ? '新增用户' : '编辑用户'}
      visible={visible}
      onOk={onSubmit}
      onCancel={onClose}
      confirmLoading={submitting}
      unmountOnExit
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        <Form.Item
          field="username"
          label="用户名"
          rules={type === 'add' ? [
            { required: true, message: '请输入用户名' },
            { minLength: 2, maxLength: 20, message: '用户名长度应在2-20个字符之间' },
          ] : []}
        >
          <Input disabled={type === 'edit'} placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item
          field="phone"
          label="手机号"
          rules={[{ match: /^1[3-9]\d{9}$/, message: '电话号码格式不正确' }]}
        >
          <Input placeholder="请输入手机号" />
        </Form.Item>
        <Form.Item
          field="email"
          label="邮箱"
          rules={[{ type: 'email', message: '邮箱格式不正确' }]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        {type === 'add' && (
          <Form.Item
            field="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { minLength: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        )}
        <Form.Item
          field="roleIds"
          label="角色"
          rules={[{ required: true, message: '请选择角色' }]}
        >
          <Select mode="multiple" placeholder="请选择角色">
            {roleOptions.map(r => (
              <Select.Option key={r.id} value={r.id}>
                {r.roleName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UserFormDialog
