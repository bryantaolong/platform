# Platform 项目文档

[![Java 17](https://img.shields.io/badge/Java-17-blue.svg)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot-3.0-green.svg)](https://spring.io/projects/spring-boot)
[![Vue 3](https://img.shields.io/badge/Vue-3.0-brightgreen.svg)](https://vuejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

## 项目简介

Platform 是一个全栈内容社交平台，采用 Spring Boot 3 后端与 Vue 3 前端技术栈。平台支持用户管理、内容发布、社交互动、智能推荐和 AI 集成等功能。

### 核心功能

- **用户系统**: 注册/登录、JWT 认证、角色权限管理（管理员/审核员/用户）
- **内容管理**: 文章发布（支持 Markdown）、草稿箱、图片上传、审核流程
- **社交互动**: 点赞、收藏、评论（支持嵌套回复）、关注系统
- **智能推荐**: 基于用户画像的个性化内容推荐
- **热门排行**: 基于热度算法的实时排行榜
- **AI 集成**: 支持 Deepseek/Moonshot/MiniMax 多模型对话和内容摘要
- **管理后台**: 用户管理、内容审核、系统日志、算法配置

## 技术栈

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 17 | 编程语言 |
| Spring Boot | 3.x | 应用框架 |
| Spring Security | 6.x | 安全认证 |
| MyBatis | 3.x | ORM 框架 |
| PostgreSQL | 14+ | 主数据库 |
| Redis | 6+ | 缓存/会话 |
| JWT | 0.12.x | 身份认证 |
| Maven | 3.8+ | 构建工具 |

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4+ | 前端框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 5.x | 构建工具 |
| Element Plus | 2.x | UI 组件库 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Axios | 1.x | HTTP 客户端 |

## 快速开始

### 环境要求

- JDK 17+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Maven 3.8+

### 1. 克隆项目

```bash
git clone <repository-url>
cd platform
```

### 2. 初始化数据库

```bash
# 创建数据库
createdb platform

# 执行初始化脚本
psql -d platform -f sql/create_table.sql
```

### 3. 启动后端

```bash
# 开发模式
./mvnw spring-boot:run

# 或使用 Maven
mvn spring-boot:run
```

后端服务默认运行在 http://localhost:8080

### 4. 启动前端

```bash
cd ui-vue
npm install
npm run dev
```

前端开发服务器默认运行在 http://localhost:5173

### 5. 访问应用

打开浏览器访问 http://localhost:5173

## 项目结构

```
platform/
├── docs/                           # 项目文档
│   ├── README.md                   # 本文档
│   ├── architecture-overview.md    # 架构总览
│   ├── api-documentation.md        # API 文档
│   ├── deployment-guide.md         # 部署指南
│   ├── development-guide.md        # 开发指南
│   └── recommendation-algorithm-report.md  # 推荐算法报告
│
├── src/main/java/com/bryan/platform/  # 后端源码
│   ├── controller/                 # REST API 控制器
│   ├── service/                    # 业务逻辑层
│   ├── mapper/                     # 数据访问层
│   ├── domain/                     # 领域模型
│   │   ├── entity/                 # 数据库实体
│   │   ├── request/                # 请求对象
│   │   ├── vo/                     # 视图对象
│   │   └── dto/                    # 数据传输对象
│   ├── config/                     # 配置类
│   └── util/                       # 工具类
│
├── src/main/resources/
│   ├── mapper/                     # MyBatis XML 映射
│   ├── application.yaml            # 主配置
│   └── application-dev.yaml        # 开发环境配置
│
├── ui-vue/                         # 前端源码
│   ├── src/
│   │   ├── api/                    # API 接口
│   │   ├── views/                  # 页面组件
│   │   ├── components/             # 通用组件
│   │   ├── stores/                 # Pinia 状态管理
│   │   ├── router/                 # 路由配置
│   │   └── models/                 # TypeScript 类型
│   └── package.json
│
├── sql/                            # 数据库脚本
│   ├── create_table.sql            # 建表脚本
│   ├── post/                       # 帖子相关表
│   └── user/                       # 用户相关表
│
├── postman/                        # API 测试集合
├── uploads/                        # 文件上传目录
└── pom.xml                         # Maven 配置
```

## 相关文档

| 文档 | 描述 |
|------|------|
| [架构总览](architecture-overview.md) | 系统架构设计、分层结构、数据流 |
| [API 文档](api-documentation.md) | 完整的 REST API 接口说明 |
| [部署指南](deployment-guide.md) | 生产环境部署步骤 |
| [开发指南](development-guide.md) | 开发规范、工作流程、调试技巧 |
| [推荐算法报告](recommendation-algorithm-report.md) | 推荐系统算法详解 |

## 开发团队

- **Author**: Bryan Long

## 许可证

[LICENSE](../LICENSE)
