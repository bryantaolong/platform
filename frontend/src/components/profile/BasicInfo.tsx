import { useState, useEffect, useRef } from 'react';
import { Form, Input, Radio, DatePicker, Button } from '@arco-design/web-react';
import type { FormInstance } from '@arco-design/web-react';

interface BasicFormData {
  realName: string;
  gender: 1 | 0;
  birthday: string;
  phone: string;
  email: string;
}

interface BasicInfoProps {
  username?: string;
  initialData: BasicFormData;
  loading: boolean;
  onSave: (data: BasicFormData) => void;
}

const BasicInfo: React.FC<BasicInfoProps> = ({ username, initialData, loading, onSave }) => {
  const formRef = useRef<FormInstance>(null);
  const [form, setForm] = useState<BasicFormData>({ ...initialData });

  useEffect(() => {
    setForm({ ...initialData });
  }, [initialData]);

  const handleSave = async () => {
    if (!formRef.current) return;
    try {
      await formRef.current.validate();
      onSave({ ...form });
    } catch {
      // validation failed
    }
  };

  const handleFieldChange = (key: keyof BasicFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Form ref={formRef} autoComplete="off" layout="horizontal" labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}>
      <Form.Item label="用户名">
        <Input value={username} disabled />
      </Form.Item>
      <Form.Item
        label="真实姓名"
        field="realName"
        rules={[{ minLength: 2, maxLength: 20, message: '真实姓名长度应在2-20个字符之间' }]}
      >
        <Input
          value={form.realName}
          onChange={(v) => handleFieldChange('realName', v)}
          placeholder="请输入真实姓名"
        />
      </Form.Item>
      <Form.Item label="性别" field="gender">
        <Radio.Group
          value={form.gender}
          onChange={(v) => handleFieldChange('gender', v)}
        >
          <Radio value={1}>男</Radio>
          <Radio value={0}>女</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="生日" field="birthday">
        <DatePicker
          value={form.birthday}
          onChange={(v) => handleFieldChange('birthday', v as string)}
          placeholder="选择生日"
          style={{ width: '100%' }}
        />
      </Form.Item>
      <Form.Item
        label="手机号"
        field="phone"
        rules={[
          {
            validator: (value: string | undefined, callback: (msg?: string) => void) => {
              if (!value) return callback();
              const pattern = /^1[3-9]\d{9}$/;
              pattern.test(value) ? callback() : callback('电话号码格式不正确');
            },
          },
        ]}
      >
        <Input
          value={form.phone}
          onChange={(v) => handleFieldChange('phone', v)}
          placeholder="请输入手机号"
        />
      </Form.Item>
      <Form.Item
        label="邮箱"
        field="email"
        rules={[{ type: 'email', message: '邮箱格式不正确' }]}
      >
        <Input
          value={form.email}
          onChange={(v) => handleFieldChange('email', v)}
          placeholder="请输入邮箱"
        />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 5 }}>
        <Button type="primary" loading={loading} onClick={handleSave}>
          保存修改
        </Button>
      </Form.Item>
    </Form>
  );
};

export default BasicInfo;
