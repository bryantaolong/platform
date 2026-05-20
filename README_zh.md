# 平台系统 (Java)

## 项目简介

本项目是基于 Spring Boot 3 的综合性平台系统，支持用户管理、内容发布、社交功能和数据导出等功能。平台包含用户注册、登录、信息管理、基于角色的权限控制、文章管理、用户关注关系、文章收藏等功能。后端采用 PostgreSQL 作为主数据库，Redis 用于缓存和分布式场景，支持 JWT 无状态认证和基于角色的权限控制。

> **注意：** 这是 **Java** 实现分支。Go 实现请参见 [`main`](../main) 分支。

## 技术栈

* Java 17
* Spring Boot 3.5.4
* MyBatis
* PostgreSQL 17.x
* Redis
* Spring Security
* EasyExcel (阿里巴巴 Excel 导出)
* Lombok
* JJWT (JWT 令牌)
* Maven 3.9.x

## 项目结构

```
backend/
├── .mvn/                  # Maven Wrapper
├── src/
│   ├── main/
│   │   ├── java/com/bryan/platform/
│   │   │   ├── config/         # 配置类（安全、Redis、MyBatis等）
│   │   │   ├── controller/     # RESTful 控制器（认证、文章、用户模块）
│   │   │   ├── domain/         # 实体、请求/响应对象、VO、枚举、转换器
│   │   │   ├── filter/         # JWT 认证过滤器
│   │   │   ├── handler/        # 全局异常处理、PostgreSQL 类型处理器
│   │   │   ├── job/            # 定时任务（用户画像更新、图片清理等）
│   │   │   ├── mapper/         # MyBatis mapper 接口
│   │   │   ├── service/        # 业务服务层
│   │   │   └── util/           # 工具类（JWT、HTTP等）
│   │   └── resources/
│   │       ├── application.yaml
│   │       ├── application-dev.yaml
│   │       └── mapper/         # MyBatis Mapper XML 文件
│   └── test/
│       └── java/com/bryan/platform/
├── logs/                  # 应用日志
├── uploads/               # 文件上传目录（头像、文章图片）
├── mvnw / mvnw.cmd        # Maven Wrapper 脚本
└── pom.xml                # Maven 项目配置
frontend/                  # Vue 3 前端
sql/                       # 数据库建表脚本
docs/                      # 文档
```

## 环境要求

* JDK 17+
* Maven 3.9.x
* PostgreSQL 17.x
* Redis 6.x 或更高

## 配置说明

* 数据库连接、Redis 配置请在 `backend/src/main/resources/application-dev.yaml` 中修改。
* 日志、MyBatis 等通用配置见 `backend/src/main/resources/application.yaml`。
* 数据库建表脚本见 [`sql/create_table.sql`](sql/create_table.sql) 及相关子目录。

## 启动方式

1. 初始化数据库（PostgreSQL），执行建表脚本：

   ```sh
   psql -U postgres -d postgres -f sql/create_table.sql
   psql -U postgres -d postgres -f sql/post/post.sql
   psql -U postgres -d postgres -f sql/post/post_algorithm.sql
   psql -U postgres -d postgres -f sql/post/post_comment.sql
   # ... 依次执行 sql/ 子目录中的其余 SQL 文件
   ```

2. 启动 Redis 服务。

3. 进入 `backend/` 目录，使用 Maven 构建并运行：

   ```sh
   cd backend
   ./mvnw spring-boot:run
   ```

   或直接运行打包后的 JAR：

   ```sh
   cd backend
   mvn clean package
   java -jar target/platform-0.0.1-SNAPSHOT.jar
   ```

## 主要功能

### 👤 用户与社交系统
* **身份认证**：基于 JWT 的无状态安全注册与登录体系。
* **个人中心**：全方位的个人资料管理，支持头像上传及公开主页展示。
* **社交关系**：动态关注/粉丝系统，列表深度集成用户身份标识（头像/姓名）。
* **私信消息**：互相关注用户之间私信，支持未读数、会话列表与撤回。
* **权限控制**：基于角色的细粒度访问控制（RBAC），确保管理与用户操作的数据安全。

### 📝 内容发布管理
* **创作流**：支持文章创建、草稿暂存、正式发布、审核及删除的全生命周期管理。
* **互动体验**：集成树状评论系统及高性能的文章点赞/取消点赞功能。
* **个性收藏**：支持多文件夹分类收藏文章，打造个人知识库。

### 🛠️ 高级扩展能力
* **AI 赋能**：集成 LLM 大模型，支持智能对话聊天及文章自动摘要生成。
* **数据导出**：支持按字段筛选并导出专业级 Excel 用户报表。
* **系统监控**：内置日志管理与管理员审核工具，保障平台稳定运行。

## 其他说明

* JWT 密钥建议在生产环境通过环境变量注入，避免硬编码。
* 全局异常处理类见 [`GlobalExceptionHandler`](backend/src/main/java/com/bryan/platform/handler/GlobalExceptionHandler.java)。
* 逻辑删除字段为 `deleted`：0 表示未删除，1 表示已删除。

## License

本项目采用 MIT 协议。详见 [LICENSE](LICENSE)。
