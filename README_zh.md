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
      handler/        # 全局异常处理、PostgreSQL 类型处理器
      interceptor/    # MyBatis 自动填充
      mapper/         # MyBatis mapper 接口
      service/        # 业务服务层
      util/           # 工具类（JWT、HTTP等）
    resources/
      application.yaml
      application-dev.yaml
      mapper/         # MyBatis Mapper XML 文件
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
* 数据库建表脚本见 [`sql/create_table.sql`](sql/create_table.sql) 及相关子目录。

## 启动方式

1. 初始化数据库（PostgreSQL），执行建表脚本：

   ```sh
   psql -U postgres -d postgres -f sql/create_table.sql
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
      - ./sql/create_table.sql:/docker-entrypoint-initdb.d/create_table.sql
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

### 👤 用户与社交系统
* **身份认证**：基于 JWT 的无状态安全注册与登录体系。
* **个人中心**：全方位的个人资料管理，支持头像上传及公开主页展示。
* **社交关系**：动态关注/粉丝系统，列表深度集成用户身份标识（头像/姓名）。
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

* JWT 密钥建议在生产环境通过配置文件注入，避免硬编码。
* 全局异常处理类见 [`GlobalExceptionHandler`](src/main/java/com/bryan/platform/handler/GlobalExceptionHandler.java)。
* 逻辑删除字段为 `deleted`：0 表示未删除，1 表示已删除。

## License

本项目采用 MIT 协议。详见 [LICENSE](LICENSE)。
