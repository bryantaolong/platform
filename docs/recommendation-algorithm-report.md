# 用户内容推荐算法分析报告

## 概述

本项目采用**基于用户画像的内容推荐算法**，结合**多路召回 + 加权排序**的架构。算法核心是基于标签匹配的内容推荐（Content-Based Filtering），而非协同过滤或深度学习模型。

---

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        推荐服务层                             │
│                  (RecommendationService)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ 兴趣召回  │  │ 社交召回  │  │ 热门召回  │
   │ 50 items │  │ 30 items │  │ 20 items │
   └────┬─────┘  └────┬─────┘  └────┬─────┘
        └─────────────┼─────────────┘
                      ▼
            ┌─────────────────┐
            │   候选集合并     │
            │  (去重 + 混合)   │
            └────────┬────────┘
                     ▼
            ┌─────────────────┐
            │   个性化排序     │
            │ 加权融合分数计算 │
            │ 0.4×热度 + 0.6×个性化│
            └────────┬────────┘
                     ▼
            ┌─────────────────┐
            │    返回结果      │
            └─────────────────┘
```

### 1.2 关键配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `RECALL_LIMIT_INTEREST` | 50 | 兴趣召回最大数量 |
| `RECALL_LIMIT_FOLLOWING` | 30 | 社交召回最大数量 |
| `RECALL_LIMIT_HOT` | 20 | 热门召回最大数量 |
| `HOT_SCORE_WEIGHT` | 0.4 | 热度分数权重 |
| `PERSONAL_SCORE_WEIGHT` | 0.6 | 个性化分数权重 |

---

## 2. 用户画像系统

### 2.1 用户兴趣模型

**核心实体**: `UserProfileInterest`

```java
@Data
@Builder
public class UserProfileInterest {
    private Long id;
    private Long userId;           // 用户ID
    private String interestTag;    // 兴趣标签
    private Double weight;         // 兴趣权重（动态计算）
    private String source;         // 来源：behavior_analysis
    // 审计字段...
}
```

**数据表结构**:
```sql
CREATE TABLE "user_profile_interest" (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    interest_tag VARCHAR(50) NOT NULL,
    weight       DOUBLE PRECISION DEFAULT 0 NOT NULL,
    source       VARCHAR(20),
    deleted      INTEGER DEFAULT 0,
    version      INTEGER DEFAULT 0,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, interest_tag)
);
```

### 2.2 行为权重配置

用户行为对兴趣标签的贡献权重：

| 行为类型 | 权重 | 说明 |
|---------|------|------|
| `VIEW` (浏览) | 0.5 | 最弱信号 |
| `LIKE` (点赞) | 1.0 | 正向反馈 |
| `COMMENT` (评论) | 2.0 | 强参与信号 |
| `COLLECT` (收藏) | 3.0 | 高价值信号 |
| `SHARE` (分享) | 4.0 | 最强信号 |

**最大保留标签数**: 20个（按权重排序取Top 20）

### 2.3 画像更新算法

```java
public void updateUserProfile(Long userId) {
    // 1. 获取用户近期行为（默认30天内）
    List<UserBehaviorLog> behaviors = getRecentBehaviors(userId, 30);

    // 2. 提取标签并累加权重
    Map<String, Double> tagWeights = new HashMap<>();
    for (UserBehaviorLog behavior : behaviors) {
        Post post = postMapper.selectById(behavior.getPostId());
        if (post != null && post.getTags() != null) {
            double weight = getBehaviorWeight(behavior.getBehaviorType());
            for (String tag : post.getTags()) {
                tagWeights.merge(tag, weight, Double::sum);
            }
        }
    }

    // 3. 排序取Top 20
    List<Map.Entry<String, Double>> sortedTags = tagWeights.entrySet()
        .stream()
        .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
        .limit(MAX_INTEREST_COUNT)
        .collect(Collectors.toList());

    // 4. 保存到数据库
    saveUserInterests(userId, sortedTags);
}
```

---

## 3. 推荐算法详解

### 3.1 多路召回策略

#### 3.1.1 兴趣召回（内容-based）

```java
private List<Post> recallByInterest(Long userId) {
    // 获取Top 5兴趣标签
    List<String> interests = userProfileService.getUserTopInterests(userId, 5);

    // PostgreSQL数组重叠查询
    return postMapper.selectByTags(interests, RECALL_LIMIT_INTEREST);
}
```

**SQL实现**（使用PostgreSQL数组操作符）：
```xml
<select id="selectByTags" resultMap="BaseResultMap">
    SELECT * FROM post
    WHERE status = 'PUBLISHED'
    AND deleted = 0
    AND tags && #{tags}  <!-- 数组重叠操作符 && -->
    ORDER BY created_at DESC
    LIMIT #{limit}
</select>
```

#### 3.1.2 社交召回

```java
private List<Post> recallByFollowing(Long userId) {
    // 获取关注列表
    List<Long> followingIds = userFollowMapper.selectFollowingIdsByFollowerId(userId);

    // 查询关注用户的帖子
    return postMapper.selectByUserIds(followingIds, RECALL_LIMIT_FOLLOWING);
}
```

#### 3.1.3 热门召回（兜底）

当兴趣召回或社交召回不足时，用热门内容补充：

```java
private List<Post> recallByHot(int limit) {
    return hotRankService.getHotPosts(limit);
}
```

### 3.2 个性化排序算法

#### 3.2.1 排序公式

```
FinalScore = HotScore × 0.4 + PersonalScore × 0.6
```

#### 3.2.2 热度分数计算

```java
// 热度分数基于Reddit Hot算法变种
public double calculateHotScore(Post post) {
    long likes = post.getLikesCount();
    long comments = post.getCommentsCount();
    long views = post.getViewsCount();

    // 加权互动分数
    double engagementScore = views * 0.1 + likes * 1.0 + comments * 2.0;

    // 时间衰减
    long hoursSincePublished = ChronoUnit.HOURS.between(
        post.getCreatedAt(), LocalDateTime.now()
    );
    double timeDecay = Math.pow(0.95, hoursSincePublished);

    return engagementScore * timeDecay;
}
```

#### 3.2.3 个性化分数计算

```java
private double calculatePersonalScore(Post post, Set<String> userInterests) {
    if (post.getTags() == null || userInterests.isEmpty()) {
        return 0.0;
    }

    // 计算匹配标签数
    long matchCount = post.getTags().stream()
            .filter(userInterests::contains)
            .count();

    // 归一化分数（0-100）
    return (double) matchCount / post.getTags().size() * 100;
}
```

#### 3.2.4 完整排序流程

```java
private List<Post> rankPosts(List<Post> posts, Long userId) {
    // 获取用户兴趣标签集合
    Set<String> interestSet = userProfileService.getUserInterestSet(userId);

    return posts.stream()
        .map(post -> {
            double hotScore = hotRankService.calculateHotScore(post);
            double personalScore = calculatePersonalScore(post, interestSet);
            double finalScore = hotScore * HOT_SCORE_WEIGHT
                              + personalScore * PERSONAL_SCORE_WEIGHT;
            return new PostScore(post, finalScore);
        })
        .sorted(Comparator.comparing(PostScore::score).reversed())
        .map(PostScore::post)
        .collect(Collectors.toList());
}
```

---

## 4. 行为追踪系统

### 4.1 行为日志实体

```java
@Data
@Builder
public class UserBehaviorLog {
    private Long id;
    private Long userId;           // 用户ID
    private Long postId;           // 帖子ID
    private String behaviorType;   // view/like/collect/comment/share
    private Integer durationSeconds; // 浏览时长（秒）
    // 审计字段...
}
```

### 4.2 行为记录流程

```java
@Transactional
public void recordBehaviorAndUpdateProfile(Long userId, Long postId,
                                          String behaviorType, Integer duration) {
    // 1. 记录行为日志
    UserBehaviorLog log = UserBehaviorLog.builder()
        .userId(userId)
        .postId(postId)
        .behaviorType(behaviorType)
        .durationSeconds(duration)
        .build();
    userBehaviorLogMapper.insert(log);

    // 2. 同步更新用户画像
    this.updateUserProfile(userId);
}
```

### 4.3 行为埋点位置

| 行为 | 触发时机 | 调用位置 |
|------|---------|---------|
| `VIEW` | 帖子详情页加载 | `PostController.getPostById()` |
| `LIKE` | 点赞按钮点击 | `LikeService.createLike()` |
| `COLLECT` | 收藏按钮点击 | `CollectionService.createCollection()` |
| `COMMENT` | 评论提交成功 | `CommentService.createComment()` |
| `SHARE` | 分享按钮点击 | `PostController.recordShare()` |

---

## 5. 定时任务与批量更新

### 5.1 定时任务配置

```java
@Component
@RequiredArgsConstructor
public class UserProfileUpdateJob {

    /**
     * 每日凌晨2点执行全量用户画像更新
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void updateAllUserProfiles() {
        // 1. 获取活跃用户（30天内有登录）
        List<Long> activeUserIds = userMapper.selectActiveUserIds(30);

        // 2. 批量处理（每批100用户）
        int batchSize = 100;
        for (int i = 0; i < activeUserIds.size(); i += batchSize) {
            List<Long> batch = activeUserIds.subList(
                i, Math.min(i + batchSize, activeUserIds.size())
            );
            userProfileService.batchUpdateProfiles(batch);
        }
    }
}
```

### 5.2 更新策略对比

| 策略 | 触发时机 | 优点 | 缺点 |
|------|---------|------|------|
| 实时更新 | 每次行为记录后 | 画像即时反映最新兴趣 | 写操作频繁，性能开销大 |
| 定时批量 | 每日凌晨2点 | 减少实时写压力 | 画像更新有延迟 |
| 手动刷新 | 用户主动触发 | 用户可控 | 依赖用户操作 |

**当前实现**：实时更新（行为后立即更新）+ 定时全量校准

---

## 6. 冷启动处理

### 6.1 新用户识别

```java
public List<Post> getRecommendations(Long userId) {
    // 检查用户是否有足够的行为数据
    int behaviorCount = userBehaviorLogMapper.countByUserId(userId);

    if (behaviorCount < MIN_BEHAVIOR_THRESHOLD) {
        // 冷启动：返回热门内容
        return getHotPostsForNewUser();
    }

    // 正常推荐流程
    return personalizedRecommend(userId);
}
```

### 6.2 冷启动内容策略

```java
@GetMapping("/hot/new-user")
@PreAuthorize("permitAll()")
public Result<List<PostSummaryVO>> getHotFeedForNewUser(
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "10") Integer pageSize) {
    // 新用户看到的内容：
    // 1. 全站热门内容
    // 2. 按热度分数排序
    // 3. 覆盖多样化标签
    List<Post> hotPosts = hotRankService.getDiverseHotPosts(page, pageSize);
    return Result.success(convertToVO(hotPosts));
}
```

---

## 7. API 接口

### 7.1 推荐相关端点

| 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|
| `/api/recommendation/feed` | GET | 个性化推荐（完整帖子） | 需要 |
| `/api/recommendation/feed/summary` | GET | 个性化推荐（摘要） | 需要 |
| `/api/recommendation/hot/new-user` | GET | 新用户热门推荐 | 公开 |
| `/api/recommendation/interests` | GET | 获取用户兴趣标签 | 需要 |
| `/api/recommendation/profile/refresh` | POST | 手动刷新画像 | 需要 |

### 7.2 请求/响应示例

**获取个性化推荐**:
```http
GET /api/recommendation/feed?page=1&pageSize=10
Authorization: Bearer {token}
```

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1001,
        "title": "Spring Boot 性能优化技巧",
        "content": "...",
        "tags": ["Java", "Spring Boot", "性能优化"],
        "author": {
          "id": 101,
          "nickname": "技术大佬"
        },
        "likesCount": 128,
        "commentsCount": 32,
        "viewsCount": 1024
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

---

## 8. 前端实现

### 8.1 个性化Feed组件

```vue
<!-- PersonalizedFeed.vue -->
<template>
  <div class="personalized-feed">
    <div class="interest-tags" v-if="userStore.isAuthenticated">
      <span class="label">你的兴趣：</span>
      <el-tag v-for="tag in userInterests" :key="tag">{{ tag }}</el-tag>
    </div>

    <PostList
      :posts="posts"
      :loading="loading"
      @load-more="loadMore"
    />

    <el-empty
      v-if="!loading && posts.length === 0"
      description="暂无推荐内容"
    />
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore();
const posts = ref<Post[]>([]);
const userInterests = ref<string[]>([]);

// 加载推荐内容
const loadRecommendations = async () => {
  if (userStore.isAuthenticated) {
    // 已登录：个性化推荐
    const res = await getPersonalizedFeed(page.value, pageSize);
    posts.value.push(...res.data.list);

    // 加载兴趣标签
    const interestRes = await getUserInterests(5);
    userInterests.value = interestRes.data;
  } else {
    // 未登录：热门推荐
    const res = await getHotFeedForNewUser(page.value, pageSize);
    posts.value.push(...res.data);
  }
};
</script>
```

---

## 9. 算法特点总结

### 9.1 当前实现的优势

1. **简单易维护**：基于规则的权重系统，无需训练模型
2. **可解释性强**：推荐结果可以追溯至具体标签匹配
3. **实时性好**：用户行为立即反映到画像更新
4. **资源消耗低**：无需GPU/ML推理服务

### 9.2 局限性

1. **无协同过滤**：无法发现"相似用户"的偏好
2. **标签依赖**：内容必须有标签才能被推荐
3. **冷启动问题**：新用户/新内容推荐质量有限
4. **多样性不足**：容易陷入"信息茧房"
5. **无序列建模**：不考虑用户行为的时间序列模式

### 9.3 未来优化方向

| 方向 | 描述 | 复杂度 |
|------|------|--------|
| 协同过滤 | 引入User-User或Item-Item CF | 中等 |
| 嵌入向量 | 使用Word2Vec/Doc2Vec学习标签/内容向量 | 中等 |
| 深度学习 | 使用DSSM、DeepFM等深度推荐模型 | 高 |
| 序列推荐 | 使用RNN/Transformer建模行为序列 | 高 |
| 多臂老虎机 | 使用Bandit算法平衡探索与利用 | 中等 |

---

## 10. 核心文件索引

### 后端 (Java)

| 文件 | 职责 |
|------|------|
| [`RecommendationController.java`](../src/main/java/com/bryan/platform/controller/recommendation/RecommendationController.java) | 推荐API控制器 |
| [`RecommendationService.java`](../src/main/java/com/bryan/platform/service/recommendation/RecommendationService.java) | 核心推荐逻辑 |
| [`PostHotRankService.java`](../src/main/java/com/bryan/platform/service/algorithm/PostHotRankService.java) | 热度计算服务 |
| [`UserInterestProfileService.java`](../src/main/java/com/bryan/platform/service/user/UserInterestProfileService.java) | 用户画像管理 |
| [`UserProfileUpdateJob.java`](../src/main/java/com/bryan/platform/service/job/UserProfileUpdateJob.java) | 定时更新任务 |
| [`UserProfileInterest.java`](../src/main/java/com/bryan/platform/domain/entity/user/UserProfileInterest.java) | 用户兴趣实体 |
| [`UserBehaviorLog.java`](../src/main/java/com/bryan/platform/domain/entity/user/UserBehaviorLog.java) | 行为日志实体 |

### 前端 (Vue)

| 文件 | 职责 |
|------|------|
| [`recommendation.ts`](../ui-vue/src/api/algorithm/recommendation.ts) | 推荐API客户端 |
| [`PersonalizedFeed.vue`](../ui-vue/src/components/post/PersonalizedFeed.vue) | 个性化Feed组件 |
| [`RecommendFeed.vue`](../ui-vue/src/views/post/RecommendFeed.vue) | 推荐页面 |

### 数据库 (SQL)

| 文件 | 说明 |
|------|------|
| [`user_profile_interest.sql`](../sql/user/user_profile_interest.sql) | 用户兴趣表 |
| [`user_behavior_log.sql`](../sql/user/user_behavior_log.sql) | 行为日志表 |

---

## 附录：算法流程图

```
┌──────────────────────────────────────────────────────────────┐
│                      用户行为触发                             │
│         (浏览/点赞/收藏/评论/分享)                             │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      记录行为日志                             │
│              UserBehaviorLogMapper.insert()                  │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    同步更新用户画像                           │
│            UserInterestProfileService.updateProfile()        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. 查询用户近期行为                                    │  │
│  │ 2. 提取帖子标签                                        │  │
│  │ 3. 按行为类型加权累加                                  │  │
│  │ 4. 排序取Top 20                                        │  │
│  │ 5. 保存到 user_profile_interest 表                      │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    用户请求推荐Feed                          │
│              GET /api/recommendation/feed                    │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    推荐服务处理流程                          │
│           RecommendationService.getPersonalizedFeed()        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 多路召回                                                │  │
│  │ ├─ recallByInterest()  → 50 items (基于用户画像)        │  │
│  │ ├─ recallByFollowing() → 30 items (社交关系)            │  │
│  │ └─ recallByHot()       → 20 items (兜底热门)            │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 候选集合并与去重                                       │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 个性化排序 rankPosts()                                 │  │
│  │ ├─ calculateHotScore()     → 热度分数                  │  │
│  │ ├─ calculatePersonalScore() → 个性化匹配分数           │  │
│  │ └─ FinalScore = 0.4×Hot + 0.6×Personal                │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 分页返回结果                                           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```
