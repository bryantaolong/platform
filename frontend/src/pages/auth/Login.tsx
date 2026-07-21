import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Message,
} from '@arco-design/web-react';
import {
  IconUser,
  IconLock,
  IconArrowRight,
  IconCheckCircle,
  IconUserGroup,
} from '@arco-design/web-react/icon';
import { useUserStore } from '@/stores/user';
import './Login.css';

interface LoginFormData {
  username: string;
  password: string;
}

interface RoleConfig {
  key: string;
  name: string;
  icon: JSX.Element;
  loginTitle: string;
  desc: string;
  usernamePlaceholder: string;
  loginBtnText: string;
  redirectPath: string;
}

const roleList: RoleConfig[] = [
  {
    key: 'user',
    name: '普通用户',
    icon: <IconUser />,
    loginTitle: '用户登录',
    desc: '个人中心与内容管理',
    usernamePlaceholder: '请输入用户名',
    loginBtnText: '立即登录',
    redirectPath: '/',
  },
  {
    key: 'auditor',
    name: '运营人员',
    icon: <IconCheckCircle />,
    loginTitle: '运营人员登录',
    desc: '内容审核与运营监控',
    usernamePlaceholder: '请输入运营人员账号',
    loginBtnText: '运营人员登录',
    redirectPath: '/admin/audit',
  },
  {
    key: 'admin',
    name: '管理员',
    icon: <IconUserGroup />,
    loginTitle: '管理员登录',
    desc: '系统管理与数据维护',
    usernamePlaceholder: '请输入管理员账号',
    loginBtnText: '管理员登录',
    redirectPath: '/admin/users',
  },
];

const Login = () => {
  const navigate = useNavigate();
  const userStore = useUserStore();
  const [formRef] = Form.useForm<LoginFormData>();

  const [currentRole, setCurrentRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });

  const currentRoleObj = useMemo(
    () => roleList.find((role) => role.key === currentRole) || roleList[0],
    [currentRole]
  );

  const handleRoleChange = useCallback((roleKey: string) => {
    setCurrentRole(roleKey);
    setFormData({ username: '', password: '' });
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      await formRef.validate();
    } catch {
      return;
    }

    setLoading(true);
    try {
      const result = await userStore.login(formData.username, formData.password);

      if (result.success) {
        Message.success('登录成功！');

        const userRoles = userStore.userInfo?.roles || '';
        let redirectPath = '/';

        if (userRoles.includes('ROLE_ADMIN')) {
          redirectPath = '/admin/users';
        } else if (userRoles.includes('ROLE_MODERATOR')) {
          redirectPath = '/admin/audit';
        }

        navigate(redirectPath);
      } else {
        Message.error(result.message || '登录失败');
      }
    } catch (error) {
      Message.error('登录失败，请稍后重试');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, userStore, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleLogin();
      }
    },
    [handleLogin]
  );

  return (
    <div className="login-container">
      {/* 左侧欢迎区域 */}
      <div className="login-welcome">
        <div className="welcome-content">
          {/* 顶部 Logo */}
          <div className="brand-section">
            <div className="logo-box">
              <span className="logo-icon">⚡</span>
            </div>
            <div className="brand-text">
              <h1 className="system-title">Platform</h1>
              <p className="system-version">V 2.0</p>
            </div>
          </div>

          {/* 主标语 */}
          <div className="hero-section">
            <h2 className="hero-title">
              <span className="gradient-text">智能驱动</span>
              <br />
              <span className="white-text">内容管理新体验</span>
            </h2>
            <p className="hero-desc">
              为团队打造的高效协作平台，让内容管理更简单、更智能、更安全
            </p>
          </div>

          {/* 数据展示 */}
          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">系统可用性</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">&lt;50ms</div>
              <div className="stat-label">响应速度</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">256</div>
              <div className="stat-label">位加密</div>
            </div>
          </div>
        </div>

        {/* 背景装饰 */}
        <div className="welcome-bg">
          <div className="grid-pattern"></div>
          <div className="glow-blob blob1"></div>
          <div className="glow-blob blob2"></div>
          <div className="geo-shape shape1">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="rgba(255,255,255,0.08)"
                d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,71.4,32.6C60.6,43.7,50.3,53,38.8,61.3C27.3,69.6,14.6,76.9,0.8,75.6C-13,74.3,-26,64.4,-38.9,55.2C-51.8,46,-64.6,37.5,-73.7,25.3C-82.8,13.1,-88.2,-2.8,-84.3,-17.1C-80.4,-31.4,-67.2,-44.1,-53.6,-51.7C-40,-59.3,-26,-61.8,-12.3,-62.8C1.4,-63.8,14.8,-63.3,30.5,-83.6L44.7,-76.4Z"
                transform="translate(100 100)"
              />
            </svg>
          </div>
          <div className="geo-shape shape2">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="rgba(255,255,255,0.06)"
                d="M41.6,-70.6C53.3,-62.9,61.9,-50.6,69.7,-37.7C77.5,-24.8,84.5,-11.3,83.4,1.6C82.3,14.5,73.1,26.8,63.6,37.9C54.1,49,44.3,58.9,32.7,66.3C21.1,73.7,7.7,78.6,-4.3,85.9C-16.3,93.2,-26.9,102.9,-37.8,99.8C-48.7,96.7,-59.9,80.8,-67.6,65.8C-75.3,50.8,-79.5,36.7,-81.3,22.3C-83.1,7.9,-82.5,-6.8,-76.6,-19.8C-70.7,-32.8,-59.5,-44.1,-47.4,-51.7C-35.3,-59.3,-22.3,-63.2,-9.1,-63.5C4.1,-63.8,17.4,-60.5,30,-78.3L41.6,-70.6Z"
                transform="translate(100 100)"
              />
            </svg>
          </div>
          <div className="floating-lines">
            <div className="line line1"></div>
            <div className="line line2"></div>
            <div className="line line3"></div>
          </div>
        </div>
      </div>

      {/* 右侧登录区域 */}
      <div className="login-panel">
        <div className="login-card">
          {/* 角色选择 */}
          <div className="role-selector">
            {roleList.map((role) => (
              <div
                key={role.key}
                className={`role-item${currentRole === role.key ? ' active' : ''}`}
                onClick={() => handleRoleChange(role.key)}
              >
                <span className="role-icon">{role.icon}</span>
                <span className="role-name">{role.name}</span>
              </div>
            ))}
          </div>

          {/* 登录标题 */}
          <div className="login-header">
            <div className="role-title">
              <span className="role-title-icon">{currentRoleObj.icon}</span>
              <span>{currentRoleObj.loginTitle}</span>
            </div>
            <div className="role-desc">{currentRoleObj.desc}</div>
          </div>

          <Form<LoginFormData>
            form={formRef}
            className="login-form"
            size="large"
            layout="vertical"
            initialValues={formData}
            onValuesChange={(_, values) => setFormData({ ...formData, ...values })}
          >
            <Form.Item
              field="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { minLength: 2, maxLength: 20, message: '用户名长度应在2-20个字符之间' },
              ]}
            >
              <Input
                placeholder={currentRoleObj.usernamePlaceholder}
                prefix={<IconUser />}
                allowClear
              />
            </Form.Item>

            <Form.Item
              field="password"
              rules={[
                { required: true, message: '请输入密码' },
                { minLength: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password
                placeholder="请输入密码"
                prefix={<IconLock />}
                allowClear
                onKeyDown={handleKeyDown}
              />
            </Form.Item>

            <Form.Item className="form-options">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Checkbox checked={rememberMe} onChange={setRememberMe}>
                  记住密码
                </Checkbox>
                <Button type="text" size="small">
                  忘记密码？
                </Button>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                size="large"
                loading={loading}
                className="login-button"
                onClick={handleLogin}
              >
                <span>{currentRoleObj.loginBtnText}</span>
                <IconArrowRight className="btn-icon" />
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <span>还没有账号？</span>
            <Button type="text" size="small" onClick={() => navigate('/register')}>
              立即注册
            </Button>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="copyright">© 2025 内容管理平台 v1.0</div>
      </div>
    </div>
  );
};

export default Login;
