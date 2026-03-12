<template>
  <div class="login-container">
    <!-- 左侧欢迎区域 -->
    <div class="login-welcome">
      <div class="welcome-content">
        <!-- 顶部 Logo -->
        <div class="brand-section">
          <div class="logo-box">
            <el-icon class="logo-icon"><Platform /></el-icon>
          </div>
          <div class="brand-text">
            <h1 class="system-title">Platform</h1>
            <p class="system-version">V 2.0</p>
          </div>
        </div>
        
        <!-- 主标语 -->
        <div class="hero-section">
          <h2 class="hero-title">
            <span class="gradient-text">智能驱动</span>
            <br />
            <span class="white-text">内容管理新体验</span>
          </h2>
          <p class="hero-desc">
            为团队打造的高效协作平台，让内容管理更简单、更智能、更安全
          </p>
        </div>
        
        <!-- 数据展示 -->
        <div class="stats-section">
          <div class="stat-item">
            <div class="stat-number">99.9%</div>
            <div class="stat-label">系统可用性</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">&lt;50ms</div>
            <div class="stat-label">响应速度</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">256</div>
            <div class="stat-label">位加密</div>
          </div>
        </div>
      </div>
      
      <!-- 背景装饰 -->
      <div class="welcome-bg">
        <!-- 网格背景 -->
        <div class="grid-pattern"></div>
        <!-- 渐变光晕 -->
        <div class="glow-blob blob1"></div>
        <div class="glow-blob blob2"></div>
        <!-- 几何图形 -->
        <div class="geo-shape shape1">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="rgba(255,255,255,0.08)" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,71.4,32.6C60.6,43.7,50.3,53,38.8,61.3C27.3,69.6,14.6,76.9,0.8,75.6C-13,74.3,-26,64.4,-38.9,55.2C-51.8,46,-64.6,37.5,-73.7,25.3C-82.8,13.1,-88.2,-2.8,-84.3,-17.1C-80.4,-31.4,-67.2,-44.1,-53.6,-51.7C-40,-59.3,-26,-61.8,-12.3,-62.8C1.4,-63.8,14.8,-63.3,30.5,-83.6L44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div class="geo-shape shape2">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="rgba(255,255,255,0.06)" d="M41.6,-70.6C53.3,-62.9,61.9,-50.6,69.7,-37.7C77.5,-24.8,84.5,-11.3,83.4,1.6C82.3,14.5,73.1,26.8,63.6,37.9C54.1,49,44.3,58.9,32.7,66.3C21.1,73.7,7.7,78.6,-4.3,85.9C-16.3,93.2,-26.9,102.9,-37.8,99.8C-48.7,96.7,-59.9,80.8,-67.6,65.8C-75.3,50.8,-79.5,36.7,-81.3,22.3C-83.1,7.9,-82.5,-6.8,-76.6,-19.8C-70.7,-32.8,-59.5,-44.1,-47.4,-51.7C-35.3,-59.3,-22.3,-63.2,-9.1,-63.5C4.1,-63.8,17.4,-60.5,30,-78.3L41.6,-70.6Z" transform="translate(100 100)" />
          </svg>
        </div>
        <!-- 浮动线条 -->
        <div class="floating-lines">
          <div class="line line1"></div>
          <div class="line line2"></div>
          <div class="line line3"></div>
        </div>
      </div>
    </div>
    
    <!-- 右侧登录区域 -->
    <div class="login-panel">
      <div class="login-card">
        <!-- 角色选择 -->
        <div class="role-selector">
          <div 
            v-for="role in roleList" 
            :key="role.key"
            class="role-item"
            :class="{ active: currentRole === role.key }"
            @click="currentRole = role.key"
          >
            <el-icon class="role-icon"><component :is="role.icon" /></el-icon>
            <span class="role-name">{{ role.name }}</span>
          </div>
        </div>
        
        <!-- 登录标题 -->
        <div class="login-header">
          <div class="role-title">
            <el-icon class="role-title-icon"><component :is="currentRoleObj.icon" /></el-icon>
            <span>{{ currentRoleObj.loginTitle }}</span>
          </div>
          <div class="role-desc">{{ currentRoleObj.desc }}</div>
        </div>

        <el-form
            ref="formRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
            size="large"
        >
          <el-form-item prop="username">
            <el-input
                v-model="loginForm.username"
                :placeholder="currentRoleObj.usernamePlaceholder"
                :prefix-icon="User"
                clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                show-password
                clearable
                @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item class="form-options">
            <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
            <el-link type="primary" :underline="false" class="forgot-link">
              忘记密码？
            </el-link>
          </el-form-item>

          <el-form-item>
            <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="login-button"
                @click="handleLogin"
            >
              <span>{{ currentRoleObj.loginBtnText }}</span>
              <el-icon class="btn-icon"><ArrowRight /></el-icon>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <span>还没有账号？</span>
          <el-link type="primary" :underline="false" @click="$router.push('/register')">
            立即注册
          </el-link>
        </div>
      </div>
      
      <!-- 底部版权 -->
      <div class="copyright">
        © 2025 内容管理平台 v1.0
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, ArrowRight, Platform, Lightning, UserFilled, CircleCheck } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const rememberMe = ref(false)

// 当前选中的角色
const currentRole = ref('user')

// 角色配置
const roleList = [
  {
    key: 'user',
    name: '普通用户',
    icon: 'User',
    loginTitle: '用户登录',
    desc: '个人中心与内容管理',
    usernamePlaceholder: '请输入用户名',
    loginBtnText: '立即登录',
    redirectPath: '/'
  },
  {
    key: 'auditor',
    name: '运营人员',
    icon: 'CircleCheck',
    loginTitle: '运营人员登录',
    desc: '内容审核与运营监控',
    usernamePlaceholder: '请输入运营人员账号',
    loginBtnText: '运营人员登录',
    redirectPath: '/admin/audit'
  },
  {
    key: 'admin',
    name: '管理员',
    icon: 'UserFilled',
    loginTitle: '管理员登录',
    desc: '系统管理与数据维护',
    usernamePlaceholder: '请输入管理员账号',
    loginBtnText: '管理员登录',
    redirectPath: '/admin/users'
  }
]

// 当前角色对象
const currentRoleObj = computed(() => {
  return roleList.find(role => role.key === currentRole.value) || roleList[0]
})

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应在2-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

// 监听角色切换，清空表单
watch(currentRole, () => {
  loginForm.username = ''
  loginForm.password = ''
  formRef.value?.clearValidate()
})

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      const result = await userStore.login(loginForm.username, loginForm.password)

      if (result.success) {
        ElMessage.success('登录成功！')
        
        // 根据用户实际角色判断跳转路径
        const userRoles = userStore.userInfo?.roles || []
        let redirectPath = '/'
        
        if (userRoles.includes('ROLE_ADMIN')) {
          redirectPath = '/admin/users'
        } else if (userRoles.includes('ROLE_MODERATOR')) {
          redirectPath = '/admin/audit'
        } else {
          redirectPath = '/'
        }
        
        router.push(redirectPath)
      } else {
        ElMessage.error(result.message || '登录失败')
      }
    } catch (error) {
      ElMessage.error('登录失败，请稍后重试')
      console.error('Login error:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  overflow: hidden;
}

/* 左侧欢迎区域 */
.login-welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  padding: 60px;
  overflow: hidden;
}

.welcome-content {
  position: relative;
  z-index: 10;
  max-width: 520px;
  color: #fff;
}

/* 品牌区域 */
.brand-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 80px;
}

.logo-box {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
}

.logo-icon {
  font-size: 36px;
  color: #fff;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.system-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.system-version {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* 主标语区域 */
.hero-section {
  margin-bottom: 80px;
}

.hero-title {
  font-size: 52px;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 24px 0;
}

.gradient-text {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.white-text {
  color: #f8fafc;
}

.hero-desc {
  font-size: 18px;
  color: #94a3b8;
  line-height: 1.7;
  margin: 0;
  max-width: 440px;
}

/* 数据统计区域 */
.stats-section {
  display: flex;
  align-items: center;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #f8fafc;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #334155, transparent);
}

/* 背景装饰 */
.welcome-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

/* 网格背景 */
.grid-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
}

/* 光晕效果 */
.glow-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: pulse 8s ease-in-out infinite;
}

.blob1 {
  width: 500px;
  height: 500px;
  top: -150px;
  right: -150px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
  animation-delay: 0s;
}

.blob2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: -100px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  animation-delay: -4s;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

/* 几何图形 */
.geo-shape {
  position: absolute;
  width: 300px;
  height: 300px;
  animation: float 20s ease-in-out infinite;
}

.shape1 {
  top: 20%;
  right: -80px;
  animation-delay: 0s;
}

.shape2 {
  bottom: 10%;
  left: -60px;
  width: 250px;
  height: 250px;
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-30px) rotate(5deg);
  }
}

/* 浮动线条 */
.floating-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.line {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  animation: scan 6s linear infinite;
}

.line1 {
  width: 60%;
  top: 30%;
  left: 0;
  animation-delay: 0s;
}

.line2 {
  width: 40%;
  top: 50%;
  right: 0;
  animation-delay: -2s;
}

.line3 {
  width: 50%;
  top: 70%;
  left: 10%;
  animation-delay: -4s;
}

@keyframes scan {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(200%);
    opacity: 0;
  }
}

/* 右侧登录区域 */
.login-panel {
  width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 60px 50px;
  position: relative;
}

.login-card {
  width: 100%;
  max-width: 420px;
}

/* 角色选择 */
.role-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 40px;
  background: #f5f7fa;
  padding: 6px;
  border-radius: 12px;
}

.role-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.role-item:hover {
  color: #409eff;
}

.role-item.active {
  background: #fff;
  color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.role-icon {
  font-size: 18px;
}

.role-name {
  font-size: 14px;
  font-weight: 500;
}

/* 登录标题 */
.login-header {
  margin-bottom: 32px;
}

.role-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.role-title-icon {
  font-size: 28px;
  color: #409eff;
}

.role-desc {
  font-size: 14px;
  color: #909399;
  padding-left: 40px;
}

/* 表单样式 */
.login-form {
  margin-bottom: 24px;
}

.form-options {
  margin-bottom: 24px;
}

.forgot-link {
  float: right;
  font-size: 14px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.login-button:hover .btn-icon {
  transform: translateX(4px);
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: #606266;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.copyright {
  position: absolute;
  bottom: 24px;
  font-size: 12px;
  color: #c0c4cc;
}

/* 输入框样式 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
  padding: 4px 15px;
}

:deep(.el-input__wrapper:hover) {
  border-color: #409eff;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: #f56c6c;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-link--primary) {
  color: #409eff;
}

:deep(.el-link--primary:hover) {
  color: #66b1ff;
}

:deep(.el-input__prefix) {
  color: #909399;
}

/* 响应式适配 */
@media (max-width: 1100px) {
  .login-welcome {
    display: none;
  }
  
  .login-panel {
    width: 100%;
    padding: 40px 30px;
  }
}

@media (max-width: 1400px) {
  .hero-title {
    font-size: 42px;
  }
  
  .brand-section {
    margin-bottom: 60px;
  }
  
  .hero-section {
    margin-bottom: 60px;
  }
}
</style>