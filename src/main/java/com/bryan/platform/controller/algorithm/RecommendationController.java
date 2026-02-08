package com.bryan.platform.controller.algorithm;

import com.bryan.platform.domain.response.Result;
import com.bryan.platform.domain.vo.post.PostSummaryVO;
import com.bryan.platform.domain.vo.post.PostVO;
import com.bryan.platform.service.algorithm.RecommendationService;
import com.bryan.platform.service.user.UserInterestProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 个性化推荐控制器
 * 提供基于用户画像的个性化内容推荐接口
 *
 * @author Bryan Long
 */
@Slf4j
@RestController
@RequestMapping("/api/recommendation")
@RequiredArgsConstructor
public class RecommendationController {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 50;

    private final RecommendationService recommendationService;
    private final UserInterestProfileService userInterestProfileService;

    /**
     * 获取个性化推荐内容流
     *
     * @param page     页码（从0开始），默认0
     * @param pageSize 每页数量，默认20，最大50
     * @return 推荐帖子列表
     */
    @GetMapping("/feed")
    @PreAuthorize("isAuthenticated()")
    public Result<List<PostVO>> getPersonalizedFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {

        int validPageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
        Long userId = getCurrentUserId();

        log.info("获取个性化推荐，用户ID: {}, 页码: {}, 每页数量: {}", userId, page, validPageSize);

        List<PostVO> feed = recommendationService.getPersonalizedFeed(userId, page, validPageSize);
        return Result.success(feed);
    }

    /**
     * 获取个性化推荐内容流（摘要形式）
     *
     * @param page     页码（从0开始），默认0
     * @param pageSize 每页数量，默认20，最大50
     * @return 推荐帖子摘要列表
     */
    @GetMapping("/feed/summary")
    @PreAuthorize("isAuthenticated()")
    public Result<List<PostSummaryVO>> getPersonalizedFeedSummary(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {

        int validPageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
        Long userId = getCurrentUserId();

        log.info("获取个性化推荐（摘要），用户ID: {}, 页码: {}, 每页数量: {}", userId, page, validPageSize);

        List<PostSummaryVO> feed = recommendationService.getPersonalizedFeedSummary(userId, page, validPageSize);
        return Result.success(feed);
    }

    /**
     * 获取新用户热门推荐（冷启动）
     * 适用于没有足够行为数据的新用户
     *
     * @param page     页码（从0开始），默认0
     * @param pageSize 每页数量，默认20，最大50
     * @return 热门帖子列表
     */
    @GetMapping("/hot/new-user")
    @PreAuthorize("permitAll()")
    public Result<List<PostVO>> getHotFeedForNewUser(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {

        int validPageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);

        log.info("获取新用户热门推荐，页码: {}, 每页数量: {}", page, validPageSize);

        List<PostVO> feed = recommendationService.getHotFeedForNewUser(page, validPageSize);
        return Result.success(feed);
    }

    /**
     * 获取当前用户的兴趣标签
     *
     * @return 兴趣标签列表
     */
    @GetMapping("/interests")
    @PreAuthorize("isAuthenticated()")
    public Result<List<String>> getUserInterests(
            @RequestParam(defaultValue = "10") int limit) {

        Long userId = getCurrentUserId();
        int validLimit = Math.min(Math.max(limit, 1), 20);

        log.info("获取用户兴趣标签，用户ID: {}, 限制: {}", userId, validLimit);

        List<String> interests = userInterestProfileService.getUserTopInterests(userId, validLimit);
        return Result.success(interests);
    }

    /**
     * 手动触发用户画像更新
     * 用于测试或用户主动刷新推荐
     *
     * @return 操作结果
     */
    @PostMapping("/profile/refresh")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> refreshUserProfile() {
        Long userId = getCurrentUserId();

        log.info("手动刷新用户画像，用户ID: {}", userId);

        userInterestProfileService.updateUserProfile(userId);
        return Result.success(null);
    }

    /**
     * 获取当前登录用户ID
     * 临时实现，后续可通过安全框架获取
     */
    private Long getCurrentUserId() {
        // TODO: 从SecurityContext获取用户ID
        return 1L;
    }
}
