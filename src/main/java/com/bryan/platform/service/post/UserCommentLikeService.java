package com.bryan.platform.service.post;

import com.bryan.platform.domain.entity.post.UserCommentLike;
import com.bryan.platform.mapper.post.UserCommentLikeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * UserCommentLikeService
 *
 * @author Bryan Long
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserCommentLikeService {

    private final UserCommentLikeMapper userCommentLikeMapper;
    private final PostCommentService postCommentService;

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

    public boolean isLiked(Long userId, Long commentId) {
        return userCommentLikeMapper.existsByUserIdAndCommentId(userId, commentId);
    }
}
