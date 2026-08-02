# AGENTS.md

## 1. 前端架构

### 1.1 组件结构
```
src/
├── api/          # API调用
├── components/   # 可复用组件
├── layouts/      # 布局组件
├── types/        # TypeScript类型
│   ├── entity/   # 后端实体类型
│   ├── request/  # 请求类型
│   ├── response/ # 响应类型
│   ├── vo/       # 视图对象类型
│   └── enum/     # 枚举类型
├── router/       # Vue Router 路由配置
├── stores/       # Pinia 状态管理
├── utils/        # 工具函数
└── views/        # 页面组件
```

### 1.2 组件最佳实践
- 使用 Vue 3 SFC（`<script setup lang="ts">`）
- 使用 Composition API（`ref`、`reactive`、`computed`、`watch`、`onMounted`）
- 为 props 定义 TypeScript 接口（`defineProps<{...}>()`）
- 将可复用逻辑提取到 composables 中
- 保持组件专注于单一职责

## 2. 命名约定

- **组件**：PascalCase（例如：`PostDetail.tsx`、`UserList.tsx`）
- **自定义 hooks/工具函数**：camelCase（例如：`useUserStore`、`formatDate`）
- **常量**：UPPER_SNAKE_CASE（例如：`API_BASE_URL`）
- **CSS类**：kebab-case（例如：`post-detail-container`、`user-avatar`）
- **`/api`下的接口方法导出**：逐一对接口进行`export function`导出

    **示例：**
    ```typescript
    /**
    * 用户注册
    */
    export function register(data: RegisterRequest): Promise<Result<UserVO>> {
        return request.post('/api/auth/register', data)
    }
    ```

## 3. 文档与注释

- 为复杂函数添加JSDoc注释
- 记录组件props和emits
- 解释非显而易见的业务逻辑

## 4. 安全与认证

### 4.3 访问控制
- 在进行需要认证的 API 调用前，检查`userStore.isAuthenticated`
- 为尝试执行受保护操作的未认证用户显示登录提示
- 使用路由守卫（`beforeEach`）进行页面级访问控制

---

## 5. API设计

### 5.1 RESTful 约定
遵循 RESTful 最佳实践

### 5.2 响应格式
所有API响应使用`Result<T>`包装器：
```typescript
export interface Result<T = any> {
    code: number;    // 业务状态码
    message: string; // 业务消息
    data: T;         // 实际的业务数据
}
```

### 5.3 API优化
- **减少不必要的调用**：尽可能直接使用userId而不是通过用户名查找
- **批量操作**：优先使用单个API调用而不是多个调用
- **缓存频繁使用的数据**：将userId、资料信息存储在前端状态中
- **条件加载**：仅在需要时（如果已认证）才获取数据

## 6. 最小变更原则

### 6.1 核心规则
- **只更改必要的部分**：仅修改与需求直接相关的行
- **不要进行"顺便"重构**：不要：
    - 重新组织导入
    - 更新依赖版本
    - 重新排序无关字段
    - 修复无关的代码风格问题
- **一个提交只关注一个方面**：保持更改聚焦且原子化

### 6.2 何时打破此规则
> 依然需要先向用户提出请求，得到许可后才可操作
- 必须立即修复的安全漏洞
- 影响功能的严重错误
- 用户明确要求时

## 7. 依赖管理

### 7.1 添加依赖
- **需要明确批准**：绝不引入代码库中不存在的第三方库
- **先询问**："功能X需要依赖Y。我可以添加吗？"
- **版本一致性**：使用与现有依赖相同的版本管理方法