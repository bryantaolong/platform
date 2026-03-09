# 开发指南

本文档介绍 Platform 项目的开发规范、工作流程和调试技巧。

## 目录

- [开发环境搭建](#开发环境搭建)
- [开发工作流](#开发工作流)
- [后端开发规范](#后端开发规范)
- [前端开发规范](#前端开发规范)
- [调试技巧](#调试技巧)
- [IDE 配置](#ide-配置)

---

## 开发环境搭建

### 1. 克隆项目

```bash
git clone <repository-url>
cd platform
```

### 2. 后端环境

#### 安装 JDK 17

推荐使用 [Eclipse Temurin](https://adoptium.net/) 或 [Amazon Corretto](https://aws.amazon.com/corretto/)。

```bash
# 验证安装
java -version
# openjdk version "17.0.x" 202x-xx-xx
```

#### 安装 Maven

```bash
# macOS
brew install maven

# Ubuntu/Debian
sudo apt install maven

# Windows (Chocolatey)
choco install maven

# 验证安装
mvn -v
```

#### 配置 IDE

**IntelliJ IDEA 推荐配置**:

1. **导入项目**: File → Open → 选择 `pom.xml`
2. **设置 JDK**: File → Project Structure → SDKs → 添加 JDK 17
3. **启用注解处理**: Settings → Build → Annotation Processors → 勾选 "Enable"
4. **代码风格**: Settings → Editor → Code Style → Java → Import Scheme → 选择 Google Java Style 或项目自定义

#### 安装插件

- **Lombok** - 必需
- **MyBatisX** - MyBatis 支持
- **Rainbow Brackets** - 代码可读性
- **String Manipulation** - 字符串处理

### 3. 前端环境

#### 安装 Node.js 18+

```bash
# 使用 nvm（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 验证安装
node -v  # v18.x.x
npm -v   # 9.x.x
```

#### 安装依赖

```bash
cd ui-vue
npm install
```

#### 配置 VS Code

**推荐插件**:

- Vue - Official (Volar)
- TypeScript Vue Plugin
- ESLint
- Prettier
- Tailwind CSS IntelliSense

**settings.json 配置**:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "vue.inlayHints.missingProps": true
}
```

### 4. 数据库环境

#### 安装 PostgreSQL 14+

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# 创建数据库
createdb platform
createuser -P platform  # 设置密码
```

#### 安装 Redis 6+

```bash
# macOS
brew install redis
brew services start redis

# 验证
redis-cli ping  # 返回 PONG
```

#### 初始化数据库

```bash
# 执行初始化脚本
psql -d platform -f sql/create_table.sql
```

### 5. 启动开发环境

#### 启动后端

```bash
# 使用 Maven Wrapper
./mvnw spring-boot:run

# 或使用本地 Maven
mvn spring-boot:run
```

后端服务运行在 http://localhost:8080

#### 启动前端

```bash
cd ui-vue
npm run dev
```

前端开发服务器运行在 http://localhost:5173，并代理 API 请求到 localhost:8080

---

## 开发工作流

### Git 分支策略

采用 [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/) 简化版：

```
main       生产分支，稳定版本
  ↑
develop    开发分支，日常开发
  ↑
feature/*  功能分支，新功能开发
  ↑
fix/*      修复分支，bug 修复
```

#### 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|---------|---------|------|
| 功能分支 | `feature/功能描述` | `feature/user-auth` |
| 修复分支 | `fix/问题描述` | `fix/login-error` |
| 热修复 | `hotfix/问题描述` | `hotfix/security-patch` |

#### 工作流程

```bash
# 1. 从 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. 开发并提交
git add .
git commit -m "feat(module): add new feature"

# 3. 推送到远程
git push -u origin feature/new-feature

# 4. 创建 Pull Request 合并到 develop

# 5. 删除本地分支
git checkout develop
git branch -d feature/new-feature
```

### 提交规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖更新 |

#### Scope 范围

| 范围 | 说明 |
|------|------|
| `auth` | 认证模块 |
| `user` | 用户模块 |
| `post` | 帖子模块 |
| `comment` | 评论模块 |
| `api` | API 接口 |
| `ui` | 前端界面 |
| `db` | 数据库 |

#### 示例

```bash
# 功能提交
git commit -m "feat(auth): add password reset functionality"

# 修复提交
git commit -m "fix(post): resolve image upload timeout issue

- Increase upload size limit to 10MB
- Add progress indicator
- Fix memory leak in file handler

Closes #123"

# 文档提交
git commit -m "docs(api): update authentication documentation"
```

---

## 后端开发规范

### 包结构

```
com.bryan.platform/
├── controller/           # REST API 控制器
│   ├── auth/
│   ├── user/
│   └── post/
├── service/              # 业务逻辑层
│   ├── auth/
│   ├── user/
│   └── post/
├── mapper/               # 数据访问层
├── domain/               # 领域模型
│   ├── entity/           # 数据库实体
│   ├── request/          # 请求对象
│   ├── vo/               # 视图对象
│   ├── dto/              # 数据传输对象
│   └── converter/        # 类型转换器
├── config/               # 配置类
├── exception/            # 自定义异常
├── util/                 # 工具类
└── annotation/           # 自定义注解
```

### 命名规范

#### Java 命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 类名 | PascalCase | `UserController`, `PostService` |
| 方法/变量 | camelCase | `getUserById`, `currentUserId` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE`, `DEFAULT_STATUS` |
| 包名 | 全小写 | `com.bryan.platform.controller` |

#### 方法命名（Controller）

| 操作 | 命名 | 示例 |
|------|------|------|
| 创建 | `createXxx` | `createPost` |
| 获取单个 | `getXx`, `getXxxByXxx` | `getPostById` |
| 获取批量 | `listXxx`, `listXxxByXxx` | `listPostsByUser` |
| 搜索 | `queryXxx`, `queryXxxByXxx` | `queryPostsByTitle` |
| 修改 | `updateXxx` | `updatePost` |
| 删除 | `deleteXxx` | `deletePost` |

#### 方法命名（Service）

| 操作 | 命名 |
|------|------|
| 新增 | `create` |
| 单个查询 | `get` |
| 批量查询（分页） | `page` |
| 批量查询（不分页） | `list` |
| 修改 | `update` |
| 删除 | `delete` |

### 代码规范

#### Controller 示例

```java
/**
 * 帖子管理控制器
 * 提供帖子的创建、查询、更新、删除等接口。
 *
 * @author Bryan Long
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final PostConverter postConverter;

    /**
     * 创建帖子
     *
     * @param request 帖子创建请求，包含标题、内容、标签等
     * @return 创建成功的帖子信息
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Result<PostVO> createPost(@Valid @RequestBody PostCreateRequest request) {
        PostDTO dto = postConverter.toDTO(request);
        Post post = postService.create(dto);
        return Result.success(postConverter.toVO(post));
    }

    /**
     * 获取帖子详情
     *
     * @param id 帖子ID
     * @return 帖子详细信息
     */
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public Result<PostVO> getPostById(@PathVariable Long id) {
        Post post = postService.get(id);
        return Result.success(postConverter.toVO(post));
    }

    /**
     * 更新帖子
     *
     * @param id      帖子ID
     * @param request 更新请求
     * @return 更新后的帖子信息
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<PostVO> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostUpdateRequest request) {
        PostDTO dto = postConverter.toDTO(request);
        dto.setId(id);
        Post post = postService.update(dto);
        return Result.success(postConverter.toVO(post));
    }

    /**
     * 删除帖子
     *
     * @param id 帖子ID
     * @return 操作结果
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> deletePost(@PathVariable Long id) {
        postService.delete(id);
        return Result.success();
    }
}
```

#### Service 示例

```java
/**
 * 帖子服务
 * 实现帖子的业务逻辑，包括创建、查询、更新、删除等。
 *
 * @author Bryan Long
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostMapper postMapper;
    private final UserService userService;

    /**
     * 创建帖子
     *
     * @param dto 帖子数据传输对象
     * @return 创建的帖子实体
     */
    @Transactional
    public Post create(PostDTO dto) {
        // 1. 验证用户存在
        userService.get(dto.getUserId());

        // 2. 创建实体
        Post post = new Post();
        BeanUtils.copyProperties(dto, post);
        post.setStatus(PostStatus.DRAFT);
        post.setViewCount(0L);
        post.setLikeCount(0L);

        // 3. 保存到数据库
        postMapper.insert(post);

        log.info("Post created: id={}, userId={}", post.getId(), post.getUserId());
        return post;
    }

    /**
     * 根据ID获取帖子
     *
     * @param id 帖子ID
     * @return 帖子实体
     * @throws ResourceNotFoundException 帖子不存在时抛出
     */
    @Transactional(readOnly = true)
    public Post get(Long id) {
        Post post = postMapper.selectById(id);
        if (post == null || post.getDeleted() == 1) {
            throw new ResourceNotFoundException("Post not found: " + id);
        }
        return post;
    }

    /**
     * 更新帖子（部分更新）
     *
     * @param dto 帖子更新数据
     * @return 更新后的帖子
     */
    @Transactional
    public Post update(PostDTO dto) {
        // 1. 验证帖子存在
        Post existing = get(dto.getId());

        // 2. 验证权限
        validateOwnership(existing);

        // 3. 执行更新
        postMapper.updateById(dto);

        // 4. 返回更新后的数据
        return get(dto.getId());
    }

    /**
     * 删除帖子（逻辑删除）
     *
     * @param id 帖子ID
     */
    @Transactional
    public void delete(Long id) {
        Post post = get(id);
        validateOwnership(post);

        postMapper.logicalDelete(id);
        log.info("Post deleted: id={}", id);
    }
}
```

#### MyBatis XML 示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.bryan.platform.mapper.PostMapper">

    <resultMap id="BaseResultMap" type="com.bryan.platform.domain.entity.post.Post">
        <id column="id" property="id"/>
        <result column="user_id" property="userId"/>
        <result column="title" property="title"/>
        <result column="content" property="content"/>
        <result column="status" property="status"/>
        <result column="tags" property="tags" typeHandler="org.apache.ibatis.type.ArrayTypeHandler"/>
        <result column="view_count" property="viewCount"/>
        <result column="like_count" property="likeCount"/>
        <result column="deleted" property="deleted"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <!-- 查询单个 -->
    <select id="selectById" resultMap="BaseResultMap">
        SELECT * FROM post
        WHERE id = #{id} AND deleted = 0
    </select>

    <!-- 条件查询（分页） -->
    <select id="selectPage" resultMap="BaseResultMap">
        SELECT * FROM post
        <where>
            deleted = 0
            <if test="userId != null">
                AND user_id = #{userId}
            </if>
            <if test="status != null">
                AND status = #{status}
            </if>
            <if test="tags != null and tags.size > 0">
                AND tags &amp;&amp; #{tags}  <!-- PostgreSQL 数组重叠 -->
            </if>
        </where>
        ORDER BY created_at DESC
    </select>

    <!-- 部分更新 -->
    <update id="updateById">
        UPDATE post
        <set>
            <if test="title != null">title = #{title},</if>
            <if test="content != null">content = #{content},</if>
            <if test="status != null">status = #{status},</if>
            <if test="tags != null">tags = #{tags},</if>
            updated_at = CURRENT_TIMESTAMP
        </set>
        WHERE id = #{id} AND deleted = 0
    </update>

    <!-- 逻辑删除 -->
    <update id="logicalDelete">
        UPDATE post
        SET deleted = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = #{id}
    </update>

</mapper>
```

### 异常处理

```java
/**
 * 全局异常处理器
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public Result<Void> handleNotFound(ResourceNotFoundException e) {
        log.warn("Resource not found: {}", e.getMessage());
        return Result.error(404, e.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException e) {
        log.warn("Business error: {}", e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return Result.error(400, message);
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleGeneric(Exception e) {
        log.error("Unexpected error", e);
        return Result.error(500, "Internal server error");
    }
}
```

---

## 前端开发规范

### 目录组织

```
src/
├── api/                  # API 接口
│   ├── auth.ts
│   ├── post.ts
│   └── user.ts
├── components/           # 组件
│   ├── post/
│   └── user/
├── views/                # 页面
│   ├── auth/
│   ├── post/
│   └── profile/
├── stores/               # 状态管理
│   └── user.ts
├── models/               # TypeScript 类型
│   ├── entity/
│   ├── request/
│   └── vo/
├── router/               # 路由
│   └── index.ts
└── utils/                # 工具函数
    └── request.ts
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `PostDetail.vue`, `UserList.vue` |
| 组合式函数 | camelCase | `useUserStore`, `formatDate` |
| 工具函数 | camelCase | `formatDate`, `debounce` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL`, `DEFAULT_PAGE_SIZE` |
| CSS 类 | kebab-case | `post-detail-container` |

### 组件规范

```vue
<!-- PostCard.vue -->
<template>
  <div class="post-card">
    <h3 class="post-title">{{ post.title }}</h3>
    <p class="post-summary">{{ summary }}</p>
    <div class="post-meta">
      <span>{{ formatDate(post.createdAt) }}</span>
      <span>{{ post.author.nickname }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '@/utils/date'
import type { Post } from '@/models/entity/post'

// Props 定义
interface Props {
  post: Post
  showSummary?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSummary: true
})

// Emits 定义
const emit = defineEmits<{
  click: [postId: number]
}>()

// 计算属性
const summary = computed(() => {
  if (!props.showSummary) return ''
  return props.post.content.slice(0, 100) + '...'
})

// 方法
function handleClick() {
  emit('click', props.post.id)
}
</script>

<style scoped>
.post-card {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.post-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
}

.post-summary {
  color: #666;
  margin: 0 0 12px;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #999;
}
</style>
```

### API 调用规范

```typescript
// api/post.ts
import request from '@/utils/request'
import type { Post } from '@/models/entity/post'
import type { PostCreateRequest } from '@/models/request/post'
import type { PostVO } from '@/models/vo/post'
import type { PageResult, Result } from '@/models/response/result'

/**
 * 获取帖子列表（分页）
 */
export function getPostList(
  page: number = 1,
  pageSize: number = 10
): Promise<Result<PageResult<PostVO>>> {
  return request.get('/posts/published', {
    params: { page, pageSize }
  })
}

/**
 * 获取帖子详情
 */
export function getPostById(id: number): Promise<Result<PostVO>> {
  return request.get(`/posts/${id}`)
}

/**
 * 创建帖子
 */
export function createPost(data: PostCreateRequest): Promise<Result<PostVO>> {
  return request.post('/posts', data)
}

/**
 * 更新帖子
 */
export function updatePost(
  id: number,
  data: Partial<PostCreateRequest>
): Promise<Result<PostVO>> {
  return request.put(`/posts/${id}`, data)
}

/**
 * 删除帖子
 */
export function deletePost(id: number): Promise<Result<void>> {
  return request.delete(`/posts/${id}`)
}
```

### Store 规范

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserInfo } from '@/api/auth'
import type { LoginRequest, UserInfo } from '@/models'

export const useUserStore = defineStore(
  'user',
  () => {
    // State
    const token = ref<string>('')
    const userInfo = ref<UserInfo | null>(null)

    // Getters
    const isAuthenticated = computed(() => !!token.value)
    const isAdmin = computed(() =>
      userInfo.value?.roles?.includes('ROLE_ADMIN')
    )

    // Actions
    async function login(data: LoginRequest) {
      const res = await loginApi(data)
      token.value = res.data
      await fetchUserInfo()
      return res
    }

    async function fetchUserInfo() {
      const res = await getUserInfo()
      userInfo.value = res.data
      return res
    }

    function logout() {
      token.value = ''
      userInfo.value = null
    }

    return {
      token,
      userInfo,
      isAuthenticated,
      isAdmin,
      login,
      fetchUserInfo,
      logout
    }
  },
  {
    persist: true
  }
)
```

---

## 调试技巧

### 后端调试

#### 1. 使用 IDE 调试

```java
// 在代码中设置断点
@GetMapping("/{id}")
public Result<PostVO> getPost(@PathVariable Long id) {
    // 在此处设置断点
    Post post = postService.get(id);
    return Result.success(postConverter.toVO(post));
}
```

启动时使用 Debug 模式：`./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"`

#### 2. 日志调试

```java
// 使用 Lombok 的 @Slf4j
@Slf4j
@Service
public class PostService {

    public Post get(Long id) {
        log.debug("Getting post by id: {}", id);

        Post post = postMapper.selectById(id);
        log.debug("Found post: {}", post);

        if (post == null) {
            log.warn("Post not found: {}", id);
            throw new ResourceNotFoundException("Post not found: " + id);
        }

        return post;
    }
}
```

#### 3. API 测试

使用 Postman 或 HTTP Client：

```http
### 获取帖子
GET http://localhost:8080/api/posts/1
Authorization: Bearer {{token}}

### 创建帖子
POST http://localhost:8080/api/posts
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "title": "Test Post",
  "content": "Test content"
}
```

### 前端调试

#### 1. Vue DevTools

安装 [Vue.js DevTools](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 浏览器扩展。

#### 2. 控制台调试

```typescript
// 在组件中
<script setup lang="ts">
import { ref, watch } from 'vue'

const posts = ref([])

// 监听变化
watch(posts, (newVal) => {
  console.log('Posts updated:', newVal)
  debugger // 断点
}, { deep: true })

// 方法调试
async function fetchPosts() {
  console.log('Fetching posts...')
  const startTime = performance.now()

  const res = await getPostList()
  posts.value = res.data.list

  console.log(`Fetched ${posts.value.length} posts in ${performance.now() - startTime}ms`)
}
</script>
```

#### 3. 网络请求调试

在 `utils/request.ts` 中添加拦截器：

```typescript
// 请求拦截器
request.interceptors.request.use(
  (config) => {
    console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, config)
    return config
  },
  (error) => {
    console.error('[Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    console.log(`[Response] ${response.config.url}`, response.data)
    return response.data
  },
  (error) => {
    console.error('[Response Error]', error.response)
    return Promise.reject(error)
  }
)
```

---

## IDE 配置

### IntelliJ IDEA

#### 代码风格配置

1. **导入代码风格**: File → Settings → Editor → Code Style → Java → Import Scheme
2. **设置换行符**: Editor → Code Style → General → Line separator: `\n`
3. **自动导入**: Editor → General → Auto Import → 勾选 "Add unambiguous imports on the fly"

#### 推荐插件

- Lombok
- MyBatisX
- Rainbow Brackets
- String Manipulation
- GitToolBox
- .env files support

### VS Code

#### settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "@",
  "vue.inlayHints.missingProps": true,
  "files.associations": {
    "*.xml": "xml"
  }
}
```

#### extensions.json

```json
{
  "recommendations": [
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag"
  ]
}
```

---

## 相关文档

- [架构总览](architecture-overview.md) - 系统架构设计
- [API 文档](api-documentation.md) - REST API 接口
- [部署指南](deployment-guide.md) - 生产环境部署
