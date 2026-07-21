import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Form, Input, Button, Alert, Divider } from '@arco-design/web-react';
import type { FormInstance } from '@arco-design/web-react';

interface SecuritySettingsProps {
  loading: boolean;
  onChangePassword: (data: { oldPassword: string; newPassword: string }) => void;
  onDeleteAccount: () => void;
}

export interface SecuritySettingsRef {
  resetPasswordForm: () => void;
}

const SecuritySettings = forwardRef<SecuritySettingsRef, SecuritySettingsProps>(
  ({ loading, onChangePassword, onDeleteAccount }, ref) => {
    const formRef = useRef<FormInstance>(null);
    const [passwordForm, setPasswordForm] = useState({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    useImperativeHandle(ref, () => ({
      resetPasswordForm: () => {
        formRef.current?.resetFields();
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      },
    }));

    const handlePasswordChange = async () => {
      if (!formRef.current) return;
      try {
        await formRef.current.validate();
        onChangePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        });
      } catch {
        // validation failed
      }
    };

    const handleFieldChange = (key: string, value: string) => {
      setPasswordForm((prev) => ({ ...prev, [key]: value }));
    };

    return (
      <>
        <div className="security-section">
          <h3>修改密码</h3>
          <Form
            ref={formRef}
            autoComplete="off"
            layout="horizontal"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 19 }}
          >
            <Form.Item
              label="当前密码"
              field="oldPassword"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password
                value={passwordForm.oldPassword}
                onChange={(v) => handleFieldChange('oldPassword', v)}
                placeholder="请输入当前密码"
              />
            </Form.Item>
            <Form.Item
              label="新密码"
              field="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { minLength: 6, message: '至少6位' },
              ]}
            >
              <Input.Password
                value={passwordForm.newPassword}
                onChange={(v) => handleFieldChange('newPassword', v)}
                placeholder="请输入新密码"
              />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              field="confirmPassword"
              rules={[
                { required: true, message: '请确认新密码' },
                {
                  validator: (value: string | undefined, callback: (msg?: string) => void) => {
                    value !== passwordForm.newPassword
                      ? callback('两次输入不一致')
                      : callback();
                  },
                },
              ]}
            >
              <Input.Password
                value={passwordForm.confirmPassword}
                onChange={(v) => handleFieldChange('confirmPassword', v)}
                placeholder="请再次输入新密码"
              />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 5 }}>
              <Button type="primary" loading={loading} onClick={handlePasswordChange}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </div>
        <Divider />
        <div className="danger-section">
          <h3>危险操作</h3>
          <Alert
            type="error"
            content="注销账号是不可逆的操作，请谨慎操作！"
            showIcon
          />
          <Button type="primary" status="danger" style={{ marginTop: 16 }} onClick={onDeleteAccount}>
            注销账号
          </Button>
        </div>
      </>
    );
  }
);

export default SecuritySettings;
