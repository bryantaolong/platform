# Platform

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
      handler/        # Global exception handler, PostgreSQL type handler
      job/            # Scheduled jobs (user profile update, image cleanup, etc.)
      mapper/         # MyBatis mapper interfaces
      service/        # Service layer
      util/           # Utility classes (JWT, HTTP, etc.)
    resources/
      application.yaml
      application-dev.yaml
      mapper/         # MyBatis mapper xmls
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
* General settings (logging, MyBatis, etc.) are in `src/main/resources/application.yaml`.
* Database schema scripts are in [`sql/create_table.sql`](sql/create_table.sql) and related subdirectories.

## Getting Started

1. Initialize the PostgreSQL database by running the schema script:

   ```sh
   psql -U postgres -d postgres -f sql/create_table.sql
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

## Main Features

### 👤 User & Social System
* **Auth**: Secure registration and login with JWT-based stateless authentication.
* **Profiles**: Comprehensive personal information management including avatar uploads and public profile views.
* **Social**: Dynamic user follow/follower system with integrated profile identity (avatars/real names).
* **Messaging**: Direct messages between mutual followers, with unread counts and recall.
* **Role-Based Security**: Fine-grained access control (RBAC) ensuring data safety across administrative and user operations.

### 📝 Content Management
* **Post Lifecycle**: Full support for creating, drafting, publishing, auditing, and deleting articles.
* **Engagement**: Rich interactive features including nested comment trees and high-performance post liking.
* **Collections**: Personalized multi-folder bookmarking system for organizing favorite content.

### 🛠️ Advanced Capabilities
* **AI Integration**: Intelligent LLM-powered features for real-time chat and automated post summarization.
* **Data Export**: Professional-grade Excel reporting for user data with customizable field selection.
* **System Observability**: Integrated log management and administrative auditing tools.

## Notes

* For production, inject JWT secret via configuration file instead of hardcoding.
* Global exception handling is in [`GlobalExceptionHandler`](src/main/java/com/bryan/platform/handler/GlobalExceptionHandler.java).
* Logical delete field is `deleted`: 0 means active, 1 means deleted.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
