# API 接口文档

本文档提供 Platform 项目的完整 REST API 接口说明。

## 目录

- [API 概览](#api-概览)
- [认证方式](#认证方式)
- [响应格式](#响应格式)
- [认证接口](#认证接口)
- [用户管理接口](#用户管理接口)
- [用户资料接口](#用户资料接口)
- [关注系统接口](#关注系统接口)
- [私信消息接口](#私信消息接口)
- [帖子接口](#帖子接口)
- [评论接口](#评论接口)
- [收藏接口](#收藏接口)
- [推荐系统接口](#推荐系统接口)
- [热门排行接口](#热门排行接口)
- [LLM 接口](#llm-接口)
- [管理后台接口](#管理后台接口)

---

## API 概览

- **基础 URL**: `http://localhost:8080`
- **API 前缀**: `/api`
- **总接口数**: 90+ 个端点
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

### 接口统计

| 功能模块 | 接口数量 | 认证要求 |
|---------|---------|---------|
| 认证 | 7 | 混合 |
| 用户管理 | 12 | ADMIN |
| 用户资料 | 5 | 混合 |
| 关注系统 | 6 | 认证用户 |
| 私信消息 | 8 | 认证用户 |
| 帖子 | 17 | 混合 |
| 评论 | 12 | 混合 |
| 收藏 | 14 | 认证用户 |
| 推荐系统 | 5 | 混合 |
| 热门排行 | 1 | 公开 |
| LLM | 3 | 认证用户 |
| 管理后台 | 13 | ADMIN/MODERATOR |

---

## 认证方式

### JWT Token

平台使用 JWT (JSON Web Token) 进行身份认证。

#### 获取 Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 使用 Token

在后续请求的请求头中携带 Token：

```http
GET /api/posts/published
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token 有效期

- **默认有效期**: 24 小时
- **续期**: 需重新登录获取新 Token

---

## 响应格式

所有 API 响应均使用统一格式 `Result<T>`：

```typescript
interface Result<T> {
  code: number;      // 业务状态码 (200 表示成功)
  message: string;   // 提示信息
  data: T;          // 响应数据
}
```

### 成功响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "示例文章",
    "content": "..."
  }
}
```

### 错误响应示例

```json
{
  "code": 401,
  "message": "Unauthorized: Invalid token",
  "data": null
}
```

### 分页响应格式

```typescript
interface PageResult<T> {
  rows: T[];        // 数据列表
  total: number;    // 总记录数
  pageNum: number;  // 当前页
  pageSize: number; // 每页大小
}
```

---

## 认证接口

**Base URL**: `/api/auth`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/auth/register` | 公开 | 用户注册 |
| POST | `/api/auth/login` | 公开 | 用户登录 |
| GET | `/api/auth/me` | 认证 | 获取当前用户信息 |
| GET | `/api/auth/validate` | 公开 | 验证 Token |
| PUT | `/api/auth/password` | 认证 | 修改密码 |
| DELETE | `/api/auth` | 认证 | 注销账户 |
| GET | `/api/auth/logout` | 认证 | 退出登录 |

### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "confirmPassword": "password123",
  "phone": "13800138000",
  "email": "user@example.com"
}
```

### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 获取当前用户

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "user",
    "roles": ["ROLE_USER"],
    "status": 0
  }
}
```

---

## 用户管理接口

**Base URL**: `/api/users`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/users` | ADMIN | 创建用户 |
| GET | `/api/users` | ADMIN | 用户列表（分页） |
| GET | `/api/users/{userId}` | ADMIN | 获取用户详情 |
| GET | `/api/users/username/{username}` | ADMIN | 按用户名查询 |
| POST | `/api/users/search` | ADMIN | 高级搜索 |
| PUT | `/api/users/{userId}` | ADMIN | 更新用户 |
| PUT | `/api/users/roles/{userId}` | ADMIN | 修改角色 |
| PUT | `/api/users/password/{userId}` | ADMIN | 重置密码 |
| PUT | `/api/users/block/{userId}` | ADMIN | 封禁用户 |
| PUT | `/api/users/unblock/{userId}` | ADMIN | 解封用户 |
| DELETE | `/api/users/{userId}` | ADMIN | 删除用户 |
| GET | `/api/users/export` | ADMIN | 导出用户 |

### 创建用户

```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "phone": "13800138000",
  "email": "user@example.com",
  "roles": ["ROLE_USER"]
}
```

### 用户列表（分页）

```http
GET /api/users?page=1&pageSize=10
Authorization: Bearer {token}
```

### 高级搜索

```http
POST /api/users/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "user",
  "status": 0,
  "role": "ROLE_USER",
  "page": 1,
  "pageSize": 10
}
```

### 修改用户角色

```http
PUT /api/users/roles/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "roles": ["ROLE_USER", "ROLE_MODERATOR"]
}
```

---

## 用户资料接口

**Base URL**: `/api/user-profiles`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/user-profiles/avatar` | 认证 | 上传头像 |
| GET | `/api/user-profiles/{userId}` | 公开 | 获取用户资料 |
| GET | `/api/user-profiles/name/{realName}` | 认证 | 按姓名搜索 |
| GET | `/api/user-profiles/me` | 认证 | 获取我的资料 |
| PUT | `/api/user-profiles` | 认证 | 更新我的资料 |

### 上传头像

```http
POST /api/user-profiles/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary image data]
```

### 更新资料

```http
PUT /api/user-profiles
Authorization: Bearer {token}
Content-Type: application/json

{
  "realName": "张三",
  "gender": 1,
  "birthday": "1990-01-01",
  "avatar": "https://..."
}
```

---

## 关注系统接口

**Base URL**: `/api/user-follows`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/user-follows/follow/{followingId}` | 认证 | 关注用户 |
| POST | `/api/user-follows/unfollow/{followingId}` | 认证 | 取消关注 |
| GET | `/api/user-follows/following/{userId}` | 认证 | 关注列表 |
| GET | `/api/user-follows/followers/{userId}` | 认证 | 粉丝列表 |
| GET | `/api/user-follows/check/{followingId}` | 认证 | 检查关注状态 |
| GET | `/api/user-follows/stats/{userId}` | 认证 | 关注统计 |

### 关注用户

```http
POST /api/user-follows/follow/123
Authorization: Bearer {token}
```

### 获取关注统计

```http
GET /api/user-follows/stats/123
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "followingCount": 50,
    "followerCount": 100
  }
}
```

---

## 私信消息接口

**Base URL**: `/api/user-messages`

> 提示：仅支持 **互相关注** 的用户之间发送私信。

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/user-messages/send` | 认证 | 发送私信 |
| GET | `/api/user-messages/history/{contactId}` | 认证 | 分页获取聊天记录 |
| GET | `/api/user-messages/conversations` | 认证 | 分页获取会话列表 |
| POST | `/api/user-messages/recall/{messageId}` | 认证 | 撤回消息（2分钟内） |
| POST | `/api/user-messages/read/{contactId}` | 认证 | 标记与联系人消息为已读 |
| GET | `/api/user-messages/unread-count` | 认证 | 获取未读总数 |
| GET | `/api/user-messages/unread-count/{contactId}` | 认证 | 获取与联系人未读数 |
| GET | `/api/user-messages/can-chat/{userId}` | 认证 | 是否可聊天（互相关注） |

### 发送私信

```http
POST /api/user-messages/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "receiverId": 2,
  "content": "hello"
}
```

---

## 帖子接口

**Base URL**: `/api/posts`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/posts` | 认证 | 发布文章 |
| POST | `/api/posts/draft` | 认证 | 保存草稿 |
| POST | `/api/posts/upload/image` | 认证 | 上传图片 |
| GET | `/api/posts/all` | ADMIN/MODERATOR | 所有文章（管理） |
| GET | `/api/posts/published` | 公开 | 已发布文章 |
| GET | `/api/posts/following` | 认证 | 关注用户的文章 |
| GET | `/api/posts/{userId}/all` | 认证 | 用户的所有文章 |
| GET | `/api/posts/{userId}/published` | 认证 | 用户的公开文章 |
| GET | `/api/posts/{id}` | 公开 | 文章详情 |
| POST | `/api/posts/title` | 认证 | 按标题搜索 |
| POST | `/api/posts/admin/query` | ADMIN/MODERATOR | 高级查询 |
| PUT | `/api/posts/{id}` | 认证 | 更新文章 |
| PUT | `/api/posts/status/{id}` | ADMIN/MODERATOR | 修改状态 |
| DELETE | `/api/posts/{id}` | 认证 | 删除文章 |
| POST | `/api/posts/{id}/like` | 认证 | 点赞 |
| POST | `/api/posts/{id}/unlike` | 认证 | 取消点赞 |
| GET | `/api/posts/{id}/like/status` | 认证 | 点赞状态 |

### 发布文章

```http
POST /api/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Spring Boot 入门指南",
  "content": "# 简介\n\nSpring Boot 是...",
  "tags": ["Java", "Spring Boot"],
  "categoryId": 1,
  "commentAreaStatus": 1
}
```

### 上传图片

```http
POST /api/posts/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary image data]
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": "/uploads/post-images/xxx.png"
}
```

### 获取已发布文章

```http
GET /api/posts/published?page=1&pageSize=10
```

### 更新文章状态（审核）

```http
PUT /api/posts/status/123
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": 1
}
```

**状态码说明**:
- `1` - 已发布
- `2` - 草稿
- `3` - 仅自己可见
- `4` - 审核中
- `5` - 回收站

---

## 评论接口

**Base URL**: `/api/comments`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/comments` | 认证 | 发表评论 |
| GET | `/api/comments/post/{postId}` | 公开 | 文章所有评论 |
| GET | `/api/comments/post/{postId}/page` | 公开 | 分页评论 |
| GET | `/api/comments/post/{postId}/tree` | 公开 | 树形评论 |
| GET | `/api/comments/{commentId}/replies` | 公开 | 回复列表 |
| GET | `/api/comments/post/{postId}/hot` | 公开 | 热门评论 |
| GET | `/api/comments/post/{postId}/latest` | 公开 | 最新评论 |
| GET | `/api/comments/{id}` | 公开 | 评论详情 |
| DELETE | `/api/comments/{id}` | 认证 | 删除评论 |
| POST | `/api/comments/{id}/like` | 认证 | 点赞评论 |
| POST | `/api/comments/{id}/unlike` | 认证 | 取消点赞 |
| GET | `/api/comments/{id}/like/status` | 公开 | 点赞状态 |

### 发表评论

```http
POST /api/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "postId": 123,
  "content": "写得真好！",
  "parentId": null,    // null 为顶层评论
  "replyToUserId": null
}
```

### 获取树形评论

```http
GET /api/comments/post/123/tree
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "content": "文章很棒！",
      "user": { ... },
      "replies": [
        {
          "id": 2,
          "content": "谢谢支持！",
          "replyToUser": { ... }
        }
      ]
    }
  ]
}
```

---

## 收藏接口

### 收藏夹管理

**Base URL**: `/api/user/post-collections`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/user/post-collections` | 认证 | 创建收藏夹 |
| GET | `/api/user/post-collections` | 认证 | 我的收藏夹 |
| GET | `/api/user/post-collections/user/{userId}` | 认证 | 用户收藏夹 |
| GET | `/api/user/post-collections/{collectionId}` | 认证 | 收藏夹详情 |
| GET | `/api/user/post-collections/count` | 认证 | 收藏夹数量 |
| PUT | `/api/user/post-collections/{collectionId}` | 认证 | 更新收藏夹 |
| DELETE | `/api/user/post-collections/{collectionId}` | 认证 | 删除收藏夹 |

### 收藏记录

**Base URL**: `/api/user/post-collects`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/user/post-collects` | 认证 | 收藏文章 |
| GET | `/api/user/post-collects/user/{userId}` | 认证 | 用户收藏 |
| GET | `/api/user/post-collects` | 认证 | 我的收藏 |
| GET | `/api/user/post-collects/collection/{collectionId}` | 认证 | 收藏夹内文章 |
| GET | `/api/user/post-collects/{postId}/status` | 认证 | 收藏状态 |
| GET | `/api/user/post-collects/count` | 认证 | 收藏数量 |
| DELETE | `/api/user/post-collects/{postId}` | 认证 | 取消收藏 |

### 收藏文章

```http
POST /api/user/post-collects
Authorization: Bearer {token}
Content-Type: application/json

{
  "postId": 123,
  "collectionId": 456  // 可选，收藏到指定收藏夹
}
```

---

## 推荐系统接口

**Base URL**: `/api/recommendation`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| GET | `/api/recommendation/feed` | 认证 | 个性化推荐 |
| GET | `/api/recommendation/feed/summary` | 认证 | 推荐摘要 |
| GET | `/api/recommendation/hot/new-user` | 公开 | 新用户热门 |
| GET | `/api/recommendation/interests` | 认证 | 兴趣标签 |
| POST | `/api/recommendation/profile/refresh` | 认证 | 刷新画像 |

### 获取个性化推荐

```http
GET /api/recommendation/feed?page=1&pageSize=10
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "推荐文章标题",
        "content": "...",
        "tags": ["Java", "Spring"],
        "author": { ... },
        "likesCount": 100,
        "commentsCount": 20
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 获取兴趣标签

```http
GET /api/recommendation/interests?limit=5
Authorization: Bearer {token}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": ["Java", "Spring Boot", "Vue", "AI", "算法"]
}
```

---

## 热门排行接口

**Base URL**: `/api/posts/hot`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| GET | `/api/posts/hot` | 公开 | 热门文章 |

```http
GET /api/posts/hot?limit=10
```

---

## LLM 接口

**Base URL**: `/api/llm/chat`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| POST | `/api/llm/chat` | 认证 | AI 对话 |
| POST | `/api/llm/chat/post/summary` | 认证 | 文章摘要 |
| POST | `/api/llm/chat/clear` | 认证 | 清空对话 |

### AI 对话

```http
POST /api/llm/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "解释一下 Spring Boot 的自动配置原理",
  "provider": "deepseek"  // 可选: deepseek/moonshot/minimax
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "response": "Spring Boot 的自动配置原理是...",
    "provider": "deepseek",
    "model": "deepseek-chat"
  }
}
```

### 文章摘要

```http
POST /api/llm/chat/post/summary
Authorization: Bearer {token}
Content-Type: application/json

{
  "postId": 123,
  "maxLength": 200
}
```

---

## 管理后台接口

### 文章算法配置

**Base URL**: `/api/admin/post-algorithm`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| GET | `/api/admin/post-algorithm/weights` | ADMIN/MODERATOR | 算法权重 |
| PUT | `/api/admin/post-algorithm/weights/{id}` | ADMIN/MODERATOR | 更新权重 |
| PUT | `/api/admin/post-algorithm/posts/{postId}/weight` | ADMIN/MODERATOR | 设置文章权重 |
| PUT | `/api/admin/post-algorithm/posts/{postId}/pin` | ADMIN/MODERATOR | 置顶文章 |
| PUT | `/api/admin/post-algorithm/posts/{postId}/unpin` | ADMIN/MODERATOR | 取消置顶 |

### 系统日志

**Base URL**: `/api/admin/logs`

| 方法 | 端点 | 认证 | 描述 |
|------|------|------|------|
| GET | `/api/admin/logs` | ADMIN | 查看日志 |
| GET | `/api/admin/logs/files` | ADMIN | 日志文件列表 |

### 更新算法权重

```http
PUT /api/admin/post-algorithm/weights/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "metricValue": 5.0
}
```

**权重说明**:
- `view` - 浏览权重 (默认 0.1)
- `like` - 点赞权重 (默认 3.0)
- `comment` - 评论权重 (默认 10.0)
- `collect` - 收藏权重 (默认 15.0)
- `share` - 分享权重 (默认 12.0)

---

## 错误码说明

| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/Token 无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复点赞） |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## Postman 集合

完整的 API 测试集合位于 `postman/Platform API Collection.postman_collection.json`，可导入 Postman 进行测试。

---

## 相关文档

- [架构总览](architecture-overview.md) - 系统架构设计
- [开发指南](development-guide.md) - 开发规范
- [部署指南](deployment-guide.md) - 生产部署
