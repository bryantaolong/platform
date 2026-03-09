# 部署指南

本文档介绍 Platform 项目的生产环境部署步骤。

## 目录

- [环境要求](#环境要求)
- [准备工作](#准备工作)
- [后端部署](#后端部署)
- [前端部署](#前端部署)
- [Docker 部署](#docker-部署)
- [环境变量配置](#环境变量配置)
- [生产检查清单](#生产检查清单)
- [常见问题](#常见问题)

---

## 环境要求

### 最低配置

| 组件 | 版本 | 最低配置 |
|------|------|----------|
| JDK | 17+ | 2 CPU, 2GB RAM |
| PostgreSQL | 14+ | 2 CPU, 4GB RAM |
| Redis | 6+ | 1 CPU, 1GB RAM |
| Node.js | 18+ | 构建时使用 |

### 推荐配置

| 组件 | 配置 |
|------|------|
| 应用服务器 | 4 CPU, 8GB RAM |
| 数据库服务器 | 4 CPU, 8GB RAM |
| 缓存服务器 | 2 CPU, 4GB RAM |

---

## 准备工作

### 1. 安装依赖

#### 安装 JDK 17

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# CentOS/RHEL
sudo yum install java-17-openjdk-devel

# 验证安装
java -version
```

#### 安装 PostgreSQL 17

```bash
# Ubuntu/Debian
sudo apt install postgresql-17

# 启动服务
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### 安装 Redis 6

```bash
# Ubuntu/Debian
sudo apt install redis-server

# 启动服务
sudo systemctl enable redis
sudo systemctl start redis
```

#### 安装 Maven

```bash
# Ubuntu/Debian
sudo apt install maven

# 验证安装
mvn -v
```

#### 安装 Node.js 18

```bash
# 使用 nvm 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 验证安装
node -v
npm -v
```

### 2. 配置数据库

#### 创建数据库

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库
CREATE DATABASE platform;
CREATE USER platform WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE platform TO platform;

# 退出
\q
```

#### 执行初始化脚本

```bash
# 使用项目提供的 SQL 脚本
psql -U platform -d platform -f sql/create_table.sql
```

### 3. 配置 Redis

```bash
# 编辑 Redis 配置
sudo vim /etc/redis/redis.conf

# 建议配置（生产环境）
bind 127.0.0.1
requirepass your_redis_password
maxmemory 512mb
maxmemory-policy allkeys-lru

# 重启 Redis
sudo systemctl restart redis
```

---

## 后端部署

### 1. 配置应用

#### application-prod.yaml

创建生产环境配置文件：

```yaml
# src/main/resources/application-prod.yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/platform
    username: platform
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 20000

  data:
    redis:
      host: localhost
      port: 6379
      password: ${REDIS_PASSWORD}
      database: 0
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
          min-idle: 0

jwt:
  secret-key: ${JWT_SECRET_KEY}
  expiration-ms: 86400000

logging:
  level:
    root: WARN
    com.bryan.platform: INFO
  file:
    name: /var/log/platform/application.log
```

### 2. 构建应用

```bash
# 清理并打包
mvn clean package -DskipTests -P prod

# 生成的 JAR 文件位于
target/platform-*.jar
```

### 3. 部署应用

#### 创建应用目录

```bash
sudo mkdir -p /opt/platform
sudo mkdir -p /var/log/platform
sudo mkdir -p /opt/platform/uploads

# 复制 JAR 文件
sudo cp target/platform-*.jar /opt/platform/app.jar

# 设置权限
sudo chown -R platform:platform /opt/platform
sudo chown -R platform:platform /var/log/platform
```

#### 创建 systemd 服务

```bash
sudo vim /etc/systemd/system/platform.service
```

```ini
[Unit]
Description=Platform Application
After=syslog.target network.target postgresql.service redis.service

[Service]
User=platform
Group=platform
WorkingDirectory=/opt/platform
ExecStart=/usr/bin/java -Xms512m -Xmx2g -jar app.jar --spring.profiles.active=prod
SuccessExitStatus=143
Restart=always
RestartSec=10

Environment="DB_PASSWORD=your_db_password"
Environment="REDIS_PASSWORD=your_redis_password"
Environment="JWT_SECRET_KEY=your_jwt_secret_key"

[Install]
WantedBy=multi-user.target
```

#### 启动服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动应用
sudo systemctl enable platform
sudo systemctl start platform

# 查看状态
sudo systemctl status platform

# 查看日志
sudo journalctl -u platform -f
```

### 4. Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 前端部署

### 1. 配置生产环境

#### 修改 API 地址

```bash
cd ui-vue

# 编辑 .env.production
vim .env.production
```

```
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_TITLE=Platform
```

### 2. 构建生产包

```bash
# 安装依赖
npm ci

# 构建
npm run build

# 构建输出位于 dist/ 目录
```

### 3. 部署静态文件

#### 使用 Nginx

```bash
# 复制构建文件
sudo cp -r dist/* /var/www/platform/

# 设置权限
sudo chown -R www-data:www-data /var/www/platform
```

#### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;
    root /var/www/platform;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Docker 部署

### 使用 Docker Compose

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=platform
      - POSTGRES_USER=platform
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/create_table.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ui-vue/dist:/usr/share/nginx/html
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

#### Dockerfile

```dockerfile
# 构建阶段
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 运行阶段
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 启动

```bash
# 创建环境变量文件
vim .env

# 内容
DB_PASSWORD=your_db_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET_KEY=your_jwt_secret_key

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

---

## 环境变量配置

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DB_PASSWORD` | 数据库密码 | `SecurePass123!` |
| `REDIS_PASSWORD` | Redis 密码 | `RedisPass456!` |
| `JWT_SECRET_KEY` | JWT 签名密钥 | 至少 32 位随机字符串 |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DB_HOST` | 数据库主机 | `localhost` |
| `DB_PORT` | 数据库端口 | `5432` |
| `REDIS_HOST` | Redis 主机 | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `CORS_ALLOWED_ORIGINS` | CORS 白名单 | `http://localhost:5173` |
| `DEEPSEEK_API_KEY` | Deepseek API 密钥 | - |
| `MOONSHOT_API_KEY` | Moonshot API 密钥 | - |
| `MINIMAX_API_KEY` | MiniMax API 密钥 | - |

### 生成安全的密钥

```bash
# JWT Secret Key (32+ 字符)
openssl rand -base64 32

# 强密码
date +%s | sha256sum | base64 | head -c 32 ; echo
```

---

## 生产检查清单

### 安全配置

- [ ] 修改默认数据库密码
- [ ] 修改默认 Redis 密码
- [ ] 设置强 JWT Secret Key
- [ ] 配置 HTTPS
- [ ] 禁用 CORS 通配符
- [ ] 限制上传文件大小
- [ ] 启用日志记录
- [ ] 配置防火墙规则

### 性能优化

- [ ] 配置数据库连接池
- [ ] 配置 Redis 连接池
- [ ] 启用 Gzip 压缩
- [ ] 配置静态资源缓存
- [ ] 配置 JVM 堆内存

### 监控告警

- [ ] 配置应用日志轮转
- [ ] 设置磁盘空间监控
- [ ] 设置内存使用监控
- [ ] 设置数据库连接监控
- [ ] 配置服务健康检查

### 备份策略

- [ ] 配置数据库自动备份
- [ ] 配置上传文件备份
- [ ] 测试恢复流程

---

## 常见问题

### Q: 应用启动失败，提示数据库连接错误

**A**: 检查以下几点：
1. 确认 PostgreSQL 服务已启动
2. 检查数据库用户名和密码
3. 确认数据库 `platform` 已创建
4. 检查防火墙是否允许连接

```bash
# 测试数据库连接
psql -U platform -d platform -h localhost
```

### Q: 图片上传失败

**A**: 检查目录权限：

```bash
# 确保上传目录存在且有写权限
sudo mkdir -p /opt/platform/uploads
sudo chown -R platform:platform /opt/platform/uploads
sudo chmod 755 /opt/platform/uploads
```

### Q: Redis 连接超时

**A**: 检查 Redis 配置：

```bash
# 测试 Redis 连接
redis-cli -a your_password ping

# 检查 Redis 配置
sudo systemctl status redis
```

### Q: 前端无法访问 API

**A**: 检查 CORS 配置：

```yaml
# application.yaml
cors:
  allowed-origins: "https://your-frontend-domain.com"
```

### Q: 内存不足导致 OOM

**A**: 调整 JVM 参数：

```bash
# 修改 systemd 服务配置
ExecStart=/usr/bin/java -Xms1g -Xmx4g -jar app.jar
```

---

## 维护操作

### 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建
mvn clean package -DskipTests

# 3. 停止服务
sudo systemctl stop platform

# 4. 备份旧版本
sudo mv /opt/platform/app.jar /opt/platform/app.jar.bak

# 5. 部署新版本
sudo cp target/platform-*.jar /opt/platform/app.jar

# 6. 启动服务
sudo systemctl start platform

# 7. 验证部署
sudo systemctl status platform
```

### 查看日志

```bash
# 应用日志
sudo tail -f /var/log/platform/application.log

# 系统日志
sudo journalctl -u platform -f

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 数据库备份

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backup/platform

mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U platform platform | gzip > $BACKUP_DIR/platform_$DATE.sql.gz

# 保留最近 7 天备份
find $BACKUP_DIR -name "platform_*.sql.gz" -mtime +7 -delete
```

---

## 相关文档

- [架构总览](architecture-overview.md) - 系统架构设计
- [API 文档](api-documentation.md) - REST API 接口
- [开发指南](development-guide.md) - 开发规范
