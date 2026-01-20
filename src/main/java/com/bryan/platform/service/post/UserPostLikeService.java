package com.bryan.platform.service.post;

import com.bryan.platform.domain.entity.post.UserPostLike;
import com.bryan.platform.mapper.post.UserPostLikeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * UserPostLikeService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserPostLikeService {

    private final UserPostLikeMapper userPostLikeMapper;
    private final PostService postService;

    @Transactional
    public boolean likePost(Long userId, Long postId) {
        // 参考收藏逻辑：先检查包括已删除的记录
        boolean existsIncludeDeleted = userPostLikeMapper.existsByUserIdAndPostIdIncludeDeleted(userId, postId);

        if (existsIncludeDeleted) {
            boolean isCurrentlyLiked = userPostLikeMapper.existsByUserIdAndPostId(userId, postId);
            if (isCurrentlyLiked) {
                log.warn("用户已点赞，userId: {}, postId: {}", userId, postId);
                throw new RuntimeException("已点赞该博文");
            } else {
                int rows = userPostLikeMapper.restoreLike(userId, postId);
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

        return true;
    }

    @Transactional
    public boolean unlikePost(Long userId, Long postId) {
        // 逻辑删除点赞记录
        int rows = userPostLikeMapper.deleteByUserIdAndPostId(userId, postId);
        if (rows <= 0) {
            log.warn("取消点赞失败或原本未点赞，userId: {}, postId: {}", userId, postId);
            return false;
        }

        int updated = postService.unlikePost(postId);
        if (updated <= 0) {
            log.warn("帖子取消点赞计数更新失败，postId: {}", postId);
            throw new RuntimeException("帖子取消点赞计数更新失败");
        }
        return true;
    }

    public boolean isLiked(Long userId, Long postId) {
        return userPostLikeMapper.existsByUserIdAndPostId(userId, postId);
    }

}
