package com.bryan.platform.service.post;

import com.bryan.platform.domain.entity.post.UserCommentLike;
import com.bryan.platform.mapper.post.UserCommentLikeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 用户评论点赞业务服务
 * 提供点赞、取消点赞、状态查询及计数回写能力。
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserCommentLikeService {

    private final UserCommentLikeMapper userCommentLikeMapper;
    private final PostCommentService postCommentService;

    /**
     * 点赞评论（幂等）
     * 若已存在软删记录则恢复；否则新增。
     *
     * @param userId    用户主键
     * @param commentId 评论主键
     * @return 是否操作成功
     * @throws RuntimeException 点赞失败或计数回写失败
     */
    @Transactional
    public boolean likeComment(Long userId, Long commentId) {
        boolean existsIncludeDeleted = userCommentLikeMapper.existsByUserIdAndCommentIdIncludeDeleted(userId, commentId);

        if (existsIncludeDeleted) {
            boolean isCurrentlyLiked = userCommentLikeMapper.existsByUserIdAndCommentId(userId, commentId);
            if (isCurrentlyLiked) {
                log.warn("用户已点赞，userId: {}, commentId: {}", userId, commentId);
                throw new RuntimeException("已点赞该评论");
            } else {
                int rows = userCommentLikeMapper.restoreLike(userId, commentId);
                if (rows > 0) {
                    int updated = postCommentService.likeComment(commentId);
                    if (updated <= 0) {
                        log.warn("评论点赞计数更新失败，commentId: {}", commentId);
                        throw new RuntimeException("评论点赞计数更新失败");
                    }
                    log.info("恢复点赞成功，userId: {}, commentId: {}", userId, commentId);
                    return true;
                } else {
                    log.warn("恢复点赞失败，userId: {}, commentId: {}", userId, commentId);
                    throw new RuntimeException("恢复点赞失败");
                }
            }
        }

        UserCommentLike like = UserCommentLike.builder()
                .userId(userId)
                .commentId(commentId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(String.valueOf(userId))
                .updatedBy(String.valueOf(userId))
                .deleted(0)
                .version(0)
                .build();
        userCommentLikeMapper.insert(like);
        log.info("新增点赞记录，userId: {}, commentId: {}", userId, commentId);

        int updated = postCommentService.likeComment(commentId);
        if (updated <= 0) {
            log.warn("评论点赞计数更新失败，commentId: {}", commentId);
            throw new RuntimeException("评论点赞计数更新失败");
        }

        return true;
    }

    /**
     * 取消点赞评论（软删）
     *
     * @param userId    用户主键
     * @param commentId 评论主键
     * @return 是否取消成功
     * @throws RuntimeException 计数回写失败
     */
    @Transactional
    public boolean unlikeComment(Long userId, Long commentId) {
        int rows = userCommentLikeMapper.deleteByUserIdAndCommentId(userId, commentId);
        if (rows <= 0) {
            log.warn("取消点赞失败或原本未点赞，userId: {}, commentId: {}", userId, commentId);
            return false;
        }

        int updated = postCommentService.dislikeComment(commentId);
        if (updated <= 0) {
            log.warn("评论取消点赞计数更新失败，commentId: {}", commentId);
            throw new RuntimeException("评论取消点赞计数更新失败");
        }
        return true;
    }

    /**
     * 查询当前用户对指定评论的点赞状态
     *
     * @param userId    用户主键
     * @param commentId 评论主键
     * @return true 已点赞；false 未点赞
     */
    public boolean isLiked(Long userId, Long commentId) {
        return userCommentLikeMapper.existsByUserIdAndCommentId(userId, commentId);
    }
}