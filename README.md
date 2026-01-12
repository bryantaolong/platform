# Platform

[中文说明请见这里 (Chinese README here)](./README_zh.md)

## Project Overview

This project is a comprehensive platform system based on Spring Boot 3, supporting user management, content publishing, social features, and data export. The platform includes user registration, login, information management, role-based access control, post management, user follow relationships, post collection, and more. The backend uses PostgreSQL as the main database and Redis for caching and distributed scenarios. JWT is used for stateless authentication and role-based authorization.

## Tech Stack

* Java 17
* Spring Boot 3.5.4
* MyBatis
* PostgreSQL 17.x
* Redis
* Spring Security
* EasyExcel (Alibaba Excel export)
* Lombok
* JJWT (JWT token)
* Maven 3.9.x

## Project Structure

```
src/
  main/
    java/com/bryan/platform/
      config/         # Configuration classes (security, Redis, MyBatis-Plus, etc.)
      controller/     # RESTful controllers (auth, post, user modules)
      domain/         # Entities, request/response objects, VO, enums, converters
      filter/         # JWT authentication filter
      handler/        # MyBatis auto-fill, global exception handler
      mapper/         # MyBatis mapper interfaces
      service/        # Service layer
      util/           # Utility classes (JWT, HTTP, etc.)
    resources/
      application.yaml
      application-dev.yaml
      mapper/         # MyBatis mapper xmls
      sql/            # Database schema scripts
  test/
    java/com/bryan/platform/
      PlatformApplicationTests.java
```

## Requirements

* JDK 17+
* Maven 3.9.9+
* PostgreSQL 17.x
* Redis 6.x or above

## Configuration

* Update database and Redis settings in `src/main/resources/application-dev.yaml`.
* General settings (logging, MyBatis-Plus logic delete, etc.) are in `src/main/resources/application.yaml`.
* Database schema scripts are in [`src/main/resources/sql/create_table.sql`](sql/create_table.sql) and related subdirectories.

## Getting Started

1. Initialize the PostgreSQL database by running the schema script:

   ```sh
   psql -U postgres -d postgres -f src/main/resources/sql/create_table.sql
   ```
2. Start the Redis service.
3. Build and run the project with Maven:

   ```sh
   ./mvnw spring-boot:run
   ```

   Or run the packaged jar:

   ```sh
   mvn clean package
   java -jar target/platform-0.0.1-SNAPSHOT.jar
   ```

## 🐳 Containerized Deployment (Docker)

This project supports containerized deployment with **Docker** and **Docker Compose**.

### 1. Build the Project

Make sure you have **Docker** and **Docker Compose** installed, then build the JAR:

```bash
mvn clean package -DskipTests
```

### 2. Create Dockerfile

In the project root, create a file named `Dockerfile`:

```dockerfile
# Use official OpenJDK 17 as base image
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy the built jar into container
COPY target/platform-0.0.1-SNAPSHOT.jar app.jar

# Expose default Spring Boot port
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 3. Create docker-compose.yml

In the project root, create `docker-compose.yml`:

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

### 4. Update Spring Configuration

Edit `src/main/resources/application-dev.yaml` to use container hostnames instead of `localhost`:

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

### 5. Start Services

Run the following command to build and start all services:

```bash
docker-compose up -d --build
```

### 6. Access the Application

* Application API: [http://localhost:8080/api](http://localhost:8080/api)
* PostgreSQL: `localhost:5432` (user: `platform_user`, password: `123456`)
* Redis: `localhost:6379`

## Main Features

### Authentication & Authorization
* User registration: `POST /api/auth/register`
* User login: `POST /api/auth/login`
* Get current user: `GET /api/auth/me`
* Logout: `GET /api/auth/logout`
* Change password: `PUT /api/auth/password`
* Delete account: `DELETE /api/auth`
* Validate token: `GET /api/auth/validate`

### User Management
* List users: `GET /api/users` (admin only)
* Get user by ID: `GET /api/users/{userId}` (admin only)
* Get user by username: `GET /api/users/username/{username}` (admin only)
* Search users: `POST /api/users/search` (admin only)
* Update user: `PUT /api/users/{userId}`
* Change user role: `PUT /api/users/roles/{userId}` (admin only)
* Reset password: `PUT /api/users/password/{userId}` (admin only)
* Block user: `PUT /api/users/block/{userId}` (admin only)
* Unblock user: `PUT /api/users/unblock/{userId}` (admin only)
* Delete user: `DELETE /api/users/{userId}` (admin only)

### User Profiles
* Get user profile by user ID: `GET /api/user-profiles/{userId}`
* Get user profile by real name: `GET /api/user-profiles/name/{realName}`
* Get current user profile: `GET /api/user-profiles/me`
* Update current user profile: `PUT /api/user-profiles`

### User Roles
* List all roles: `GET /api/user-roles` (admin only)

### User Follow System
* Follow user: `POST /api/user-follows/follow/{followingId}`
* Unfollow user: `POST /api/user-follows/unfollow/{followingId}`
* Get following users: `GET /api/user-follows/following/{userId}`
* Get follower users: `GET /api/user-follows/followers/{userId}`
* Check following status: `GET /api/user-follows/check/{followingId}`
* Get user follow stats: `GET /api/user-follows/stats/{userId}`

### Post Management
* Get all posts: `GET /api/posts/all` (admin only)
* Get all published posts: `GET /api/posts/published`
* Get posts by user ID: `GET /api/posts/{userId}/all`
* Get published posts by user ID: `GET /api/posts/{userId}/published`
* Get post by ID: `GET /api/posts/{id}`
* Get post audit by ID: `GET /api/posts/audit/{id}` (admin only)
* Search posts: `GET /api/posts/search` (admin only)
* Create post: `POST /api/posts`
* Save post draft: `POST /api/posts/draft`
* Update post: `PUT /api/posts/{id}`
* Update post status: `PUT /api/posts/status/{id}?status={status}` (admin only)
* Delete post: `DELETE /api/posts/{id}`

### Post Collections & Collects
* Create collection: `POST /api/user/post-collections?folderName={folderName}`
* Update collection: `PUT /api/user/post-collections/{collectionId}?folderName={folderName}`
* Delete collection: `DELETE /api/user/post-collections/{collectionId}`
* Get user collections: `GET /api/user/post-collections`
* Get collection by ID: `GET /api/user/post-collections/{collectionId}`
* Get user collection count: `GET /api/user/post-collections/count`
* Collect post: `POST /api/user/post-collects`
* Uncollect post: `DELETE /api/user/post-collects/{postId}`
* Get user collects: `GET /api/user/post-collects`
* Get user collects by collection: `GET /api/user/post-collects/collection/{collectionId}`
* Check collect status: `GET /api/user/post-collects/{postId}/status`
* Get user collect count: `GET /api/user/post-collects/count`

### Data Export
* Export all users: `GET /api/users/export/all` (admin only)
* Export users by fields: `POST /api/users/export/fields` (admin only)
* Get exportable fields: `GET /api/users/export/fields` (admin only)

## Notes

* For production, inject JWT secret via configuration file instead of hardcoding.
* Global exception handling is in [`GlobalExceptionHandler`](src/main/java/com/bryan/platform/handler/GlobalExceptionHandler.java).
* Logical delete field is `deleted`: 0 means active, 1 means deleted.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
