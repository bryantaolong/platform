package com.bryan.platform.service.user;

import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.entity.user.UserBehaviorLog;
import com.bryan.platform.domain.entity.user.UserProfileInterest;
import com.bryan.platform.mapper.post.PostMapper;
import com.bryan.platform.mapper.post.UserPostCollectMapper;
import com.bryan.platform.mapper.post.UserPostLikeMapper;
import com.bryan.platform.mapper.user.UserBehaviorLogMapper;
import com.bryan.platform.mapper.user.UserProfileInterestMapper;
import com.bryan.platform.util.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户兴趣画像服务
 * 基于用户行为数据构建和更新用户兴趣标签权重
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserInterestProfileService {

    private final UserPostLikeMapper userPostLikeMapper;
    private final UserPostCollectMapper userPostCollectMapper;
    private final PostMapper postMapper;
    private final UserProfileInterestMapper userProfileInterestMapper;
    private final UserBehaviorLogMapper userBehaviorLogMapper;

    /**
     * 行为类型权重配置
     * 权重越高表示用户对该行为的偏好越强烈
     */
    private static final double VIEW_WEIGHT = 0.5;
    private static final double LIKE_WEIGHT = 1.0;
    private static final double COMMENT_WEIGHT = 2.0;
    private static final double COLLECT_WEIGHT = 3.0;
    private static final double SHARE_WEIGHT = 4.0;

    /**
     * 最大保留的兴趣标签数量
     */
    private static final int MAX_INTEREST_COUNT = 20;

    /**
     * 根据用户ID更新用户画像
     * 重新计算所有兴趣标签的权重
     *
     * @param userId 用户ID
     */
    @Transactional
    public void updateUserProfile(Long userId) {
        log.info("开始更新用户画像，用户ID: {}", userId);

        Map<String, Double> tagWeights = new HashMap<>();

        // 1. 从浏览行为提取兴趣（权重最低）
        List<Long> viewedPosts = userBehaviorLogMapper.selectPostIdsByUserIdAndType(userId, "view");
        aggregateTags(tagWeights, viewedPosts, VIEW_WEIGHT);

        // 2. 从点赞行为提取兴趣
        List<Long> likedPosts = userPostLikeMapper.selectPostIdsByUserId(userId);
        aggregateTags(tagWeights, likedPosts, LIKE_WEIGHT);

        // 3. 从收藏行为提取兴趣（权重较高）
        List<Long> collectedPosts = userPostCollectMapper.selectPostIdsByUserId(userId);
        aggregateTags(tagWeights, collectedPosts, COLLECT_WEIGHT);

        // 4. 清理旧数据
        userProfileInterestMapper.deleteByUserId(userId);

        // 5. 保存新的兴趣标签（按权重降序，保留TopN）
        tagWeights.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(MAX_INTEREST_COUNT)
                .forEach(entry -> {
                    UserProfileInterest interest = UserProfileInterest.builder()
                            .userId(userId)
                            .interestTag(entry.getKey())
                            .weight(entry.getValue())
                            .source("behavior_analysis")
                            .build();
                    this.fillInsert(interest);
                    userProfileInterestMapper.insert(interest);
                });

        log.info("用户画像更新完成，用户ID: {}, 兴趣标签数量: {}", userId, tagWeights.size());
    }

    /**
     * 记录用户行为并更新画像
     *
     * @param userId       用户ID
     * @param postId       帖子ID
     * @param behaviorType 行为类型：view/like/collect/comment/share
     * @param duration     停留时长（秒），浏览行为有效
     */
    @Transactional
    public void recordBehaviorAndUpdateProfile(Long userId, Long postId, String behaviorType, Integer duration) {
        // 1. 记录行为日志
        UserBehaviorLog behaviorLog = UserBehaviorLog.builder()
                .userId(userId)
                .postId(postId)
                .behaviorType(behaviorType)
                .durationSeconds(duration)
                .build();
        this.fillInsert(behaviorLog);
        userBehaviorLogMapper.insert(behaviorLog);

        // 2. 立即更新用户画像（异步处理更佳，这里简化为同步）
        // 注意：在生产环境中，建议使用消息队列异步处理
         this.updateUserProfile(userId);
    }

    /**
     * 获取用户Top N兴趣标签
     *
     * @param userId 用户ID
     * @param n      返回数量
     * @return 兴趣标签列表
     */
    public List<String> getUserTopInterests(Long userId, int n) {
        return userProfileInterestMapper.selectTopInterestsByUserId(userId, n);
    }

    /**
     * 获取用户所有兴趣标签
     *
     * @param userId 用户ID
     * @return 兴趣标签列表
     */
    public List<UserProfileInterest> getUserInterests(Long userId) {
        return userProfileInterestMapper.selectByUserId(userId);
    }

    /**
     * 检查用户画像是否存在
     *
     * @param userId 用户ID
     * @return true 表示存在画像数据
     */
    public boolean hasUserProfile(Long userId) {
        List<UserProfileInterest> interests = userProfileInterestMapper.selectByUserId(userId);
        return !interests.isEmpty();
    }

    /**
     * 聚合标签权重
     *
     * @param tagWeights 标签权重Map
     * @param postIds    帖子ID列表
     * @param baseWeight 基础权重
     */
    private void aggregateTags(Map<String, Double> tagWeights, List<Long> postIds, double baseWeight) {
        for (Long postId : postIds) {
            Post post = postMapper.selectById(postId);
            if (post != null && post.getTags() != null) {
                for (String tag : post.getTags()) {
                    tagWeights.merge(tag, baseWeight, Double::sum);
                }
            }
        }
    }

    /**
     * 批量更新用户画像（定时任务调用）
     *
     * @param userIds 用户ID列表
     */
    @Transactional
    public void batchUpdateProfiles(List<Long> userIds) {
        for (Long userId : userIds) {
            try {
                updateUserProfile(userId);
            } catch (Exception e) {
                log.error("更新用户画像失败，用户ID: {}", userId, e);
            }
        }
    }

    private void fillInsert(UserProfileInterest interest) {
        LocalDateTime now = LocalDateTime.now();
        Long operator = JwtUtils.getCurrentUserId();

        interest.setDeleted(0);
        interest.setVersion(0);
        interest.setCreatedAt(now);
        interest.setUpdatedAt(now);
        interest.setUpdatedBy(operator.toString());
        interest.setCreatedBy(operator.toString());
    }

    private void fillInsert(UserBehaviorLog behaviorLog) {
        LocalDateTime now = LocalDateTime.now();
        Long operator = JwtUtils.getCurrentUserId();

        behaviorLog.setDeleted(0);
        behaviorLog.setVersion(0);
        behaviorLog.setCreatedAt(now);
        behaviorLog.setUpdatedAt(now);
        behaviorLog.setUpdatedBy(operator.toString());
        behaviorLog.setCreatedBy(operator.toString());
    }
}
