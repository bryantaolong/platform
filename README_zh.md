# 平台系统

[English README here (英文版说明)](./README.md)

## 项目简介

本项目是基于 Spring Boot 3 的综合性平台系统，支持用户管理、内容发布、社交功能和数据导出等功能。平台包含用户注册、登录、信息管理、基于角色的权限控制、文章管理、用户关注关系、文章收藏等功能。后端采用 PostgreSQL 作为主数据库，Redis 用于缓存和分布式场景，支持 JWT 无状态认证和基于角色的权限控制。

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
src/
  main/
    java/com/bryan/platform/
      config/         # 配置类（安全、Redis、MyBatis-Plus等）
      controller/     # RESTful 控制器（认证、文章、用户模块）
      domain/         # 实体、请求/响应对象、VO、枚举、转换器
      filter/         # JWT 认证过滤器
      handler/        # MyBatis 自动填充、全局异常处理
      mapper/         # MyBatis mapper 接口
      service/        # 业务服务层
      util/           # 工具类（JWT、HTTP等）
    resources/
      application.yaml
      application-dev.yaml
      mapper/         # MyBatis Mapper XML 文件
      sql/            # 数据库建表脚本
  test/
    java/com/bryan/platform/
      PlatformApplicationTests.java
```

## 环境要求

* JDK 17+
* Maven 3.9.9+
* PostgreSQL 17.x
* Redis 6.x 或更高

## 配置说明

* 数据库连接、Redis 配置请在 `src/main/resources/application-dev.yaml` 中修改。
* 日志、MyBatis 等通用配置见 `src/main/resources/application.yaml`。
* 数据库建表脚本见 [`src/main/resources/sql/create_table.sql`](sql/create_table.sql) 及相关子目录。

## 启动方式

1. 初始化数据库（PostgreSQL），执行建表脚本：

   ```sh
   psql -U postgres -d postgres -f src/main/resources/sql/create_table.sql
   ```
2. 启动 Redis 服务。
3. 使用 Maven 构建并运行项目：

   ```sh
   ./mvnw spring-boot:run
   ```

   或直接运行打包后的 JAR：

   ```sh
   mvn clean package
   java -jar target/platform-0.0.1-SNAPSHOT.jar
   ```

## 🐳 容器化部署 (Docker)

本项目支持使用 **Docker** 和 **Docker Compose** 进行容器化部署。

### 1. 构建项目

确保已安装 **Docker** 和 **Docker Compose**，然后打包 JAR：

```bash
mvn clean package -DskipTests
```

### 2. 创建 Dockerfile

在项目根目录下新建 `Dockerfile`：

```dockerfile
# 使用官方 OpenJDK 17 作为基础镜像
FROM eclipse-temurin:17-jdk-alpine

# 设置工作目录
WORKDIR /app

# 复制构建产物
COPY target/platform-0.0.1-SNAPSHOT.jar app.jar

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 3. 创建 docker-compose.yml

在项目根目录下新建 `docker-compose.yml`：

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:17
    container_name: platform-postgres
    environment:
      POSTGRES_USER: platform_user
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./src/main/resources/sql/create_table.sql:/docker-entrypoint-initdb.d/create_table.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:6
    container_name: platform-redis
    environment:
      REDIS_PASSWORD: 123456
    ports:
      - "6379:6379"

  app:
    build: .
    container_name: platform
    depends_on:
      - postgres
      - redis
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/platform
      SPRING_DATASOURCE_USERNAME: platform_user
      SPRING_DATASOURCE_PASSWORD: 123456
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
      SPRING_REDIS_PASSWORD: 123456
    ports:
      - "8080:8080"

volumes:
  postgres_data:
```

### 4. 更新 Spring 配置

将 `src/main/resources/application-dev.yaml` 中的数据库和 Redis 主机名改为容器名：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/platform
    username: platform_user
    password: 123456
  redis:
    host: redis
    port: 6379
    password: 123456
```

### 5. 启动服务

执行以下命令构建并启动所有服务：

```bash
docker-compose up -d --build
```

### 6. 访问应用

* 应用接口: [http://localhost:8080/api](http://localhost:8080/api)
* PostgreSQL: `localhost:5432` (用户: `platform_user` / 密码: `123456`)
* Redis: `localhost:6379`

## 主要功能

### 认证与授权
* 用户注册：`POST /api/auth/register`
* 用户登录：`POST /api/auth/login`
* 获取当前用户：`GET /api/auth/me`
* 登出：`GET /api/auth/logout`
* 修改密码：`PUT /api/auth/password`
* 删除账户：`DELETE /api/auth`
* 验证令牌：`GET /api/auth/validate`

### 用户管理
* 列出用户：`GET /api/users`（管理员权限）
* 根据ID获取用户：`GET /api/users/{userId}`（管理员权限）
* 根据用户名获取用户：`GET /api/users/username/{username}`（管理员权限）
* 搜索用户：`POST /api/users/search`（管理员权限）
* 更新用户：`PUT /api/users/{userId}`
* 更改用户角色：`PUT /api/users/roles/{userId}`（管理员权限）
* 重置密码：`PUT /api/users/password/{userId}`（管理员权限）
* 封禁用户：`PUT /api/users/block/{userId}`（管理员权限）
* 解封用户：`PUT /api/users/unblock/{userId}`（管理员权限）
* 删除用户：`DELETE /api/users/{userId}`（管理员权限）

### 用户资料
* 根据用户ID获取资料：`GET /api/user-profiles/{userId}`
* 根据真实姓名获取资料：`GET /api/user-profiles/name/{realName}`
* 获取当前用户资料：`GET /api/user-profiles/me`
* 更新当前用户资料：`PUT /api/user-profiles`

### 用户角色
* 列出所有角色：`GET /api/user-roles`（管理员权限）

### 用户关注系统
* 关注用户：`POST /api/user-follows/follow/{followingId}`
* 取消关注用户：`POST /api/user-follows/unfollow/{followingId}`
* 获取关注用户列表：`GET /api/user-follows/following/{userId}`
* 获取粉丝用户列表：`GET /api/user-follows/followers/{userId}`
* 检查关注状态：`GET /api/user-follows/check/{followingId}`
* 获取用户关注统计：`GET /api/user-follows/stats/{userId}`

### 文章管理
* 获取所有文章：`GET /api/posts/all`（管理员权限）
* 获取所有已发布文章：`GET /api/posts/published`
* 根据用户ID获取文章：`GET /api/posts/{userId}/all`
* 根据用户ID获取已发布文章：`GET /api/posts/{userId}/published`
* 根据ID获取文章：`GET /api/posts/{id}`
* 根据ID获取文章审核信息：`GET /api/posts/audit/{id}`（管理员权限）
* 搜索文章：`GET /api/posts/search`（管理员权限）
* 创建文章：`POST /api/posts`
* 保存文章草稿：`POST /api/posts/draft`
* 更新文章：`PUT /api/posts/{id}`
* 更新文章状态：`PUT /api/posts/status/{id}?status={status}`（管理员权限）
* 删除文章：`DELETE /api/posts/{id}`

### 文章收藏与收藏夹
* 创建收藏夹：`POST /api/user/post-collections?folderName={folderName}`
* 更新收藏夹：`PUT /api/user/post-collections/{collectionId}?folderName={folderName}`
* 删除收藏夹：`DELETE /api/user/post-collections/{collectionId}`
* 获取用户收藏夹：`GET /api/user/post-collections`
* 根据ID获取收藏夹：`GET /api/user/post-collections/{collectionId}`
* 获取用户收藏夹数量：`GET /api/user/post-collections/count`
* 收藏文章：`POST /api/user/post-collects`
* 取消收藏文章：`DELETE /api/user/post-collects/{postId}`
* 获取用户收藏：`GET /api/user/post-collects`
* 根据收藏夹获取用户收藏：`GET /api/user/post-collects/collection/{collectionId}`
* 检查收藏状态：`GET /api/user/post-collects/{postId}/status`
* 获取用户收藏数量：`GET /api/user/post-collects/count`

### 数据导出
* 导出所有用户：`GET /api/users/export/all`（管理员权限）
* 按字段导出用户：`POST /api/users/export/fields`（管理员权限）
* 获取可导出字段：`GET /api/users/export/fields`（管理员权限）

## 其他说明

* JWT 密钥建议在生产环境通过配置文件注入，避免硬编码。
* 全局异常处理类见 [`GlobalExceptionHandler`](src/main/java/com/bryan/platform/handler/GlobalExceptionHandler.java)。
* 逻辑删除字段为 `deleted`：0 表示未删除，1 表示已删除。

## License

本项目采用 MIT 协议。详见 [LICENSE](LICENSE)。
