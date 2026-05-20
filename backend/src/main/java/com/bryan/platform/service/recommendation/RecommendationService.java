package com.bryan.platform.service.recommendation;

import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.vo.post.PostSummaryVO;
import com.bryan.platform.domain.vo.post.PostVO;
import com.bryan.platform.mapper.post.PostMapper;
import com.bryan.platform.mapper.user.UserFollowMapper;
import com.bryan.platform.service.post.PostHotRankService;
import com.bryan.platform.service.user.UserInterestProfileService;
import com.bryan.platform.domain.converter.PostConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 个性化推荐服务
 * 采用多路召回 + 排序融合的推荐架构
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserInterestProfileService userInterestProfileService;
    private final UserFollowMapper userFollowMapper;
    private final PostMapper postMapper;
    private final PostHotRankService postHotRankService;

    /**
     * 召回阶段各路返回数量
     */
    private static final int RECALL_LIMIT_INTEREST = 50;
    private static final int RECALL_LIMIT_FOLLOWING = 30;
    private static final int RECALL_LIMIT_HOT = 20;

    /**
     * 排序权重配置
     */
    private static final double HOT_SCORE_WEIGHT = 0.4;
    private static final double PERSONAL_SCORE_WEIGHT = 0.6;

    /**
     * 获取个性化推荐内容
     *
     * @param userId   用户ID
     * @param page     页码（从0开始）
     * @param pageSize 每页数量
     * @return 推荐帖子VO列表
     */
    public List<PostVO> getPersonalizedFeed(Long userId, int page, int pageSize) {
        // 1. 多路召回
        List<Post> interestPosts = this.recallByInterest(userId);
        List<Post> followingPosts = this.recallByFollowing(userId);
        List<Post> hotPosts = this.recallByHot(RECALL_LIMIT_HOT);

        // 2. 合并去重
        Set<Long> seenPostIds = new HashSet<>();
        List<Post> candidates = new ArrayList<>();

        Stream.of(interestPosts, followingPosts, hotPosts)
                .flatMap(List::stream)
                .filter(post -> post != null && seenPostIds.add(post.getId()))
                .forEach(candidates::add);

        // 3. 个性化排序
        List<Post> ranked = this.rankPosts(candidates, userId);

        // 4. 分页返回
        int fromIndex = page * pageSize;
        int toIndex = Math.min(fromIndex + pageSize, ranked.size());

        if (fromIndex >= ranked.size()) {
            return Collections.emptyList();
        }

        return ranked.subList(fromIndex, toIndex).stream()
                .map(PostConverter::toPostVO)
                .collect(Collectors.toList());
    }

    /**
     * 获取个性化推荐内容（摘要形式）
     *
     * @param userId   用户ID
     * @param page     页码（从0开始）
     * @param pageSize 每页数量
     * @return 推荐帖子摘要VO列表
     */
    public List<PostSummaryVO> getPersonalizedFeedSummary(Long userId, int page, int pageSize) {
        return this.getPersonalizedFeed(userId, page, pageSize).stream()
                .map(PostConverter::vo2SummaryVo)
                .collect(Collectors.toList());
    }

    /**
     * 获取新用户的热门推荐（冷启动）
     *
     * @param page     页码
     * @param pageSize 每页数量
     * @return 热门帖子VO列表
     */
    public List<PostVO> getHotFeedForNewUser(int page, int pageSize) {
        List<Post> hotPosts = this.recallByHot(100);
        int fromIndex = page * pageSize;
        int toIndex = Math.min(fromIndex + pageSize, hotPosts.size());

        if (fromIndex >= hotPosts.size()) {
            return Collections.emptyList();
        }

        return hotPosts.subList(fromIndex, toIndex).stream()
                .map(PostConverter::toPostVO)
                .collect(Collectors.toList());
    }

    /**
     * 兴趣标签召回
     * 根据用户画像中的兴趣标签，召回包含这些标签的帖子
     */
    private List<Post> recallByInterest(Long userId) {
        List<String> interests = userInterestProfileService.getUserTopInterests(userId, 5);
        if (interests.isEmpty()) {
            log.debug("用户 {} 没有兴趣标签数据，跳过兴趣召回", userId);
            return Collections.emptyList();
        }

        log.debug("用户 {} 兴趣标签: {}", userId, interests);
        return postMapper.selectByTags(interests, RecommendationService.RECALL_LIMIT_INTEREST);
    }

    /**
     * 关注用户内容召回
     * 召回用户关注用户发布的帖子
     */
    private List<Post> recallByFollowing(Long userId) {
        List<Long> followingIds = userFollowMapper.selectFollowingIdsByFollowerId(userId);
        if (followingIds.isEmpty()) {
            log.debug("用户 {} 没有关注任何用户，跳过关注召回", userId);
            return Collections.emptyList();
        }

        log.debug("用户 {} 关注了 {} 个用户", userId, followingIds.size());
        return postMapper.selectByUserIds(followingIds, RecommendationService.RECALL_LIMIT_FOLLOWING);
    }

    /**
     * 热门内容召回（兜底策略）
     * 召回全站热门帖子
     */
    private List<Post> recallByHot(int limit) {
        return postMapper.selectHotPosts(limit);
    }

    /**
     * 个性化排序
     * 综合考虑热度分数和个性化匹配分数
     */
    private List<Post> rankPosts(List<Post> posts, Long userId) {
        List<String> userInterests = userInterestProfileService.getUserTopInterests(userId, 10);
        Set<String> interestSet = new HashSet<>(userInterests);

        return posts.stream()
                .map(post -> {
                    double hotScore = postHotRankService.calculateHotScore(post);
                    double personalScore = this.calculatePersonalScore(post, interestSet);
                    double finalScore = hotScore * HOT_SCORE_WEIGHT + personalScore * PERSONAL_SCORE_WEIGHT;
                    return new PostScore(post, finalScore);
                })
                .sorted(Comparator.comparing(PostScore::score).reversed())
                .map(PostScore::post)
                .collect(Collectors.toList());
    }

    /**
     * 计算个性化匹配分数
     * 根据帖子标签与用户兴趣标签的重叠程度计算
     *
     * @param post         帖子
     * @param userInterests 用户兴趣标签集合
     * @return 匹配分数（0-100）
     */
    private double calculatePersonalScore(Post post, Set<String> userInterests) {
        if (post.getTags() == null || userInterests.isEmpty()) {
            return 0;
        }

        long matchCount = post.getTags().stream()
                .filter(userInterests::contains)
                .count();

        // 返回匹配比例 * 100
        return (double) matchCount / post.getTags().size() * 100;
    }

    /**
     * 帖子分数内部类
     */
    private record PostScore(Post post, double score) {}
}
