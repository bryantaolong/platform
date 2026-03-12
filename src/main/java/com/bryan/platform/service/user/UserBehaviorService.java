package com.bryan.platform.service.user;

import com.bryan.platform.domain.entity.user.UserBehaviorLog;
import com.bryan.platform.mapper.user.UserBehaviorLogMapper;
import com.bryan.platform.util.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 用户行为记录服务
 * 异步记录用户对帖子的各种行为（浏览、点赞、收藏、评论、分享）
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserBehaviorService {

    private final UserBehaviorLogMapper userBehaviorLogMapper;

    /**
     * 行为类型常量
     */
    public static final String BEHAVIOR_VIEW = "view";
    public static final String BEHAVIOR_LIKE = "like";
    public static final String BEHAVIOR_COLLECT = "collect";
    public static final String BEHAVIOR_COMMENT = "comment";
    public static final String BEHAVIOR_SHARE = "share";

    /**
     * 记录浏览行为
     *
     * @param userId 用户ID
     * @param postId 帖子ID
     * @param durationSeconds 停留时长（秒）
     */
    @Async
    public void recordView(Long userId, Long postId, Integer durationSeconds) {
        if (userId == null || postId == null) {
            return;
        }
        try {
            recordBehavior(userId, postId, BEHAVIOR_VIEW, durationSeconds);
        } catch (Exception e) {
            log.warn("记录浏览行为失败，userId: {}, postId: {}", userId, postId, e);
        }
    }

    /**
     * 记录点赞行为
     *
     * @param userId 用户ID
     * @param postId 帖子ID
     */
    @Async
    public void recordLike(Long userId, Long postId) {
        if (userId == null || postId == null) {
            return;
        }
        try {
            recordBehavior(userId, postId, BEHAVIOR_LIKE, null);
        } catch (Exception e) {
            log.warn("记录点赞行为失败，userId: {}, postId: {}", userId, postId, e);
        }
    }

    /**
     * 记录收藏行为
     *
     * @param userId 用户ID
     * @param postId 帖子ID
     */
    @Async
    public void recordCollect(Long userId, Long postId) {
        if (userId == null || postId == null) {
            return;
        }
        try {
            recordBehavior(userId, postId, BEHAVIOR_COLLECT, null);
        } catch (Exception e) {
            log.warn("记录收藏行为失败，userId: {}, postId: {}", userId, postId, e);
        }
    }

    /**
     * 记录评论行为
     *
     * @param userId 用户ID
     * @param postId 帖子ID
     */
    @Async
    public void recordComment(Long userId, Long postId) {
        if (userId == null || postId == null) {
            return;
        }
        try {
            recordBehavior(userId, postId, BEHAVIOR_COMMENT, null);
        } catch (Exception e) {
            log.warn("记录评论行为失败，userId: {}, postId: {}", userId, postId, e);
        }
    }

    /**
     * 记录分享行为
     *
     * @param userId 用户ID
     * @param postId 帖子ID
     */
    @Async
    public void recordShare(Long userId, Long postId) {
        if (userId == null || postId == null) {
            return;
        }
        try {
            recordBehavior(userId, postId, BEHAVIOR_SHARE, null);
        } catch (Exception e) {
            log.warn("记录分享行为失败，userId: {}, postId: {}", userId, postId, e);
        }
    }

    /**
     * 通用行为记录方法
     *
     * @param userId       用户ID
     * @param postId       帖子ID
     * @param behaviorType 行为类型
     * @param duration     停留时长（秒）
     */
    private void recordBehavior(Long userId, Long postId, String behaviorType, Integer duration) {
        UserBehaviorLog behaviorLog = UserBehaviorLog.builder()
                .userId(userId)
                .postId(postId)
                .behaviorType(behaviorType)
                .durationSeconds(duration)
                .build();
        this.fillInsert(behaviorLog);
        userBehaviorLogMapper.insert(behaviorLog);
    }

    private void fillInsert(UserBehaviorLog behaviorLog) {
        LocalDateTime now = LocalDateTime.now();
        Long operator = JwtUtils.getCurrentUserId();

        behaviorLog.setDeleted(0);
        behaviorLog.setVersion(0);
        behaviorLog.setCreatedAt(now);
        behaviorLog.setUpdatedAt(now);
        behaviorLog.setUpdatedBy(operator != null ? operator.toString() : "system");
        behaviorLog.setCreatedBy(operator != null ? operator.toString() : "system");
    }
}
