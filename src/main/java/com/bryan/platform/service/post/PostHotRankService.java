package com.bryan.platform.service.post;

import com.bryan.platform.config.properties.PostHotRankAlgorithmProperties;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.vo.post.PostVO;
import com.bryan.platform.service.redis.RedisStringService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostHotRankService {

    private static final String CACHE_KEY_PREFIX = "posts:hot:";
    private static final long CACHE_TTL_SECONDS = 600;

    private final PostHotRankAlgorithmProperties weights;
    private final PostService postService;
    private final RedisStringService redisStringService;
    private final ObjectMapper objectMapper;

    public double calculateHotScore(Post post) {
        // 1. 基础互动分（对数压缩）
        double interactionScore = Math.log(
                1 + post.getViewCount() * weights.get("view")
                        + post.getLikeCount() * weights.get("like")
                        + post.getCommentCount() * weights.get("comment")
                        + post.getCollectCount() * weights.get("collect")
                        + post.getShareCount() * weights.get("share")
        );

        // 2. 时间衰减
        long hours = Duration.between(post.getCreatedAt(), LocalDateTime.now()).toHours();
        double lambda = weights.get("decay_lambda");
        double timeDecay = Math.exp(-lambda * hours);

        // 3. 人工干预
        double manualScore = post.getWeight() * weights.get("manual");

        // 4. 总分
        return (interactionScore * timeDecay * 100) + manualScore;
    }

    public List<PostVO> getHotPosts(int limit) {
        String cacheKey = CACHE_KEY_PREFIX + limit;

        String cachedJson = redisStringService.get(cacheKey);
        if (cachedJson != null) {
            try {
                List<PostVO> cached = objectMapper.readValue(cachedJson, new TypeReference<List<PostVO>>() {});
                log.debug("热点帖子缓存命中，key: {}, size: {}", cacheKey, cached.size());
                return cached;
            } catch (Exception e) {
                log.error("缓存反序列化失败，key: {}", cacheKey, e);
            }
        }

        List<Post> posts = postService.listRecentPosts(limit * 10, 168);

        List<PostVO> hotPosts = posts.stream()
                .map(this::toPostVO)
                .sorted(Comparator.comparingDouble(PostVO::getHotScore).reversed())
                .limit(limit)
                .toList();

        if (!hotPosts.isEmpty()) {
            try {
                String json = objectMapper.writeValueAsString(hotPosts);
                redisStringService.set(cacheKey, json, CACHE_TTL_SECONDS);
                log.info("热点帖子缓存写入，key: {}, size: {}", cacheKey, hotPosts.size());
            } catch (Exception e) {
                log.error("缓存序列化失败，key: {}", cacheKey, e);
            }
        }

        return hotPosts;
    }

    public void warmUp(List<Integer> limits) {
        for (Integer limit : limits) {
            log.info("开始预热热点帖子缓存，limit: {}", limit);
            getHotPosts(limit);
            log.info("热点帖子缓存预热完成，limit: {}", limit);
        }
    }

    public void clearCache() {
        String pattern = CACHE_KEY_PREFIX + "*";
        try {
            Set<String> keys = redisStringService.keys(pattern);
            for (String key : keys) {
                redisStringService.delete(key);
            }
            log.info("热点帖子缓存已清除，pattern: {}, count: {}", pattern, keys.size());
        } catch (Exception e) {
            log.error("清除缓存失败，pattern: {}", pattern, e);
        }
    }

    private PostVO toPostVO(Post p) {
        return PostVO.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .title(p.getTitle())
                .content(p.getContent())
                .status(p.getStatus())
                .categoryId(p.getCategoryId())
                .tags(p.getTags())
                .commentAreaStatus(p.getCommentAreaStatus())
                .viewCount(p.getViewCount())
                .likeCount(p.getLikeCount())
                .commentCount(p.getCommentCount())
                .collectCount(p.getCollectCount())
                .shareCount(p.getShareCount())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .hotScore(calculateHotScore(p))
                .build();
    }
}
