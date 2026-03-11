package com.bryan.platform.service.post;

import com.bryan.platform.domain.entity.post.UserPostLike;
import com.bryan.platform.mapper.post.UserPostLikeMapper;
import com.bryan.platform.service.user.UserBehaviorService;
import com.bryan.platform.service.user.UserInterestProfileService;
import com.bryan.platform.util.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 用户博文点赞业务服务
 * 提供点赞、取消点赞、状态查询及计数回写能力。
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserPostLikeService {

    private final UserPostLikeMapper userPostLikeMapper;
    private final PostService postService;
    private final UserBehaviorService userBehaviorService;
    private final UserInterestProfileService userInterestProfileService;

    /**
     * 点赞博文（幂等）
     * 若已存在软删记录则恢复；否则新增。
     *
     * @param userId 用户主键
     * @param postId 博文主键
     * @return 是否操作成功
     * @throws RuntimeException 已点赞、计数回写失败等
     */
    @Transactional
    public boolean likePost(Long userId, Long postId) {
        // 先检查包括已删除的记录
        boolean existsIncludeDeleted = userPostLikeMapper.existsByUserIdAndPostIdIncludeDeleted(userId, postId);

        if (existsIncludeDeleted) {
            boolean isCurrentlyLiked = userPostLikeMapper.existsByUserIdAndPostId(userId, postId);
            if (isCurrentlyLiked) {
                log.warn("用户已点赞，userId: {}, postId: {}", userId, postId);
                throw new RuntimeException("已点赞该博文");
            } else {
                // 恢复软删记录
                UserPostLike like = userPostLikeMapper.selectByUserIdAndPostIdIncludeDeleted(userId, postId);
                if (like == null) {
                    throw new RuntimeException("点赞记录不存在");
                }
                int rows = userPostLikeMapper.restoreLike(
                        userId,
                        postId,
                        like.getVersion(),
                        LocalDateTime.now(),
                        JwtUtils.getCurrentUsername()
                );
                if (rows > 0) {
                    int updated = postService.likePost(postId);
                    if (updated <= 0) {
                        log.warn("帖子点赞计数更新失败，postId: {}", postId);
                        throw new RuntimeException("帖子点赞计数更新失败");
                    }
                    log.info("恢复点赞成功，userId: {}, postId: {}", userId, postId);
                    return true;
                } else {
                    log.warn("恢复点赞失败，userId: {}, postId: {}", userId, postId);
                    throw new RuntimeException("恢复点赞失败");
                }
            }
        }

        // 不存在任何记录，做插入
        UserPostLike like = UserPostLike.builder()
                .userId(userId)
                .postId(postId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(String.valueOf(userId))
                .updatedBy(String.valueOf(userId))
                .deleted(0)
                .version(0)
                .build();
        userPostLikeMapper.insert(like);
        log.info("新增点赞记录，userId: {}, postId: {}", userId, postId);

        int updated = postService.likePost(postId);
        if (updated <= 0) {
            log.warn("帖子点赞计数更新失败，postId: {}", postId);
            throw new RuntimeException("帖子点赞计数更新失败");
        }

        // 记录点赞行为
        userBehaviorService.recordLike(userId, postId);

        // 异步更新用户画像
        try {
            userInterestProfileService.updateUserProfile(userId);
        } catch (Exception e) {
            log.warn("更新用户画像失败，userId: {}", userId, e);
        }

        return true;
    }

    /**
     * 查询当前用户对指定博文的点赞状态
     *
     * @param userId 用户主键
     * @param postId 博文主键
     * @return true 已点赞；false 未点赞
     */
    public boolean isLiked(Long userId, Long postId) {
        return userPostLikeMapper.existsByUserIdAndPostId(userId, postId);
    }

    /**
     * 取消点赞博文（逻辑删除）
     *
     * @param userId 用户主键
     * @param postId 博文主键
     * @return 是否取消成功
     * @throws RuntimeException 计数回写失败
     */
    @Transactional
    public boolean unlikePost(Long userId, Long postId) {
        // 查询点赞记录
        UserPostLike like = userPostLikeMapper.selectByUserIdAndPostId(userId, postId);
        if (like == null) {
            log.warn("取消点赞失败或原本未点赞，userId: {}, postId: {}", userId, postId);
            return false;
        }
        // 逻辑删除点赞记录
        int rows = userPostLikeMapper.deleteByUserIdAndPostId(
                userId,
                postId,
                like.getVersion(),
                LocalDateTime.now(),
                JwtUtils.getCurrentUsername()
        );
        if (rows <= 0) {
            log.warn("取消点赞失败，可能已被其他用户修改，userId: {}, postId: {}", userId, postId);
            return false;
        }

        int updated = postService.unlikePost(postId);
        if (updated <= 0) {
            log.warn("帖子取消点赞计数更新失败，postId: {}", postId);
            throw new RuntimeException("帖子取消点赞计数更新失败");
        }

        // 取消点赞也记录行为（可选）
        return true;
    }
}
