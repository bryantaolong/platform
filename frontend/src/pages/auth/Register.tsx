import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Message, Link } from '@arco-design/web-react'
import { IconUser, IconLock, IconPhone, IconEmail } from '@arco-design/web-react/icon'
import { useUserStore } from '@/stores/user'
import type { RegisterRequest } from '@/models/request/auth'

import './Register.css'

const Register = () => {
  const navigate = useNavigate()
  const userStore = useUserStore()
  const [formRef] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const [registerForm, setRegisterForm] = useState<Omit<RegisterRequest, 'phone' | 'email'> & { phone: string; email: string; confirmPassword: string }>({
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: ''
  })

  const updateField = (field: string, value: string) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateConfirmPassword = (value: string | undefined, callback: (error?: string) => void) => {
    if (value !== registerForm.password) {
      callback('两次输入的密码不一致')
    } else {
      callback()
    }
  }

  const handleRegister = async () => {
    try {
      await formRef.validate()
    } catch {
      return
    }

    setLoading(true)
    try {
      const result = await userStore.register({
        username: registerForm.username,
        password: registerForm.password,
        phone: registerForm.phone || undefined,
        email: registerForm.email || undefined
      })

      if (result.success) {
        Message.success('注册成功！正在跳转到登录页面...')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        Message.error(result.message || '注册失败')
      }
    } catch {
      Message.error('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-title">用户注册</div>
          <div className="register-subtitle">创建您的账户</div>
        </div>

        <Form
          form={formRef}
          className="register-form"
          size="large"
          onSubmit={handleRegister}
        >
          <Form.Item
            field="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { minLength: 2, maxLength: 20, message: '用户名长度应在2-20个字符之间' }
            ]}
          >
            <Input
              value={registerForm.username}
              onChange={(value) => updateField('username', value)}
              placeholder="请输入用户名"
              prefix={<IconUser />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            field="password"
            rules={[
              { required: true, message: '请输入密码' },
              { minLength: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              value={registerForm.password}
              onChange={(value) => updateField('password', value)}
              placeholder="请输入密码"
              prefix={<IconLock />}
            />
          </Form.Item>

          <Form.Item
            field="confirmPassword"
            rules={[
              { required: true, message: '请确认密码' },
              { validator: validateConfirmPassword }
            ]}
          >
            <Input.Password
              value={registerForm.confirmPassword}
              onChange={(value) => updateField('confirmPassword', value)}
              placeholder="请确认密码"
              prefix={<IconLock />}
            />
          </Form.Item>

          <Form.Item
            field="phone"
            rules={[
              { match: /^1[3-9]\d{9}$/, message: '电话号码格式不正确' }
            ]}
          >
            <Input
              value={registerForm.phone}
              onChange={(value) => updateField('phone', value)}
              placeholder="请输入手机号码（可选）"
              prefix={<IconPhone />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            field="email"
            rules={[
              { type: 'email', message: '邮箱格式不正确' }
            ]}
          >
            <Input
              value={registerForm.email}
              onChange={(value) => updateField('email', value)}
              placeholder="请输入邮箱地址（可选）"
              prefix={<IconEmail />}
              allowClear
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              loading={loading}
              className="register-button"
              onClick={handleRegister}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className="register-footer">
          <span>已有账号？</span>
          <Link type="primary" onClick={() => navigate('/login')}>
            立即登录
          </Link>
        </div>
      </div>

      <div className="register-background">
        <div className="background-circle circle1"></div>
        <div className="background-circle circle2"></div>
        <div className="background-circle circle3"></div>
      </div>
    </div>
  )
}

export default Register
