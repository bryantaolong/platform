package com.bryan.platform.service.post;

import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.entity.post.UserPostCollect;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.mapper.post.PostMapper;
import com.bryan.platform.mapper.post.UserPostCollectMapper;
import com.bryan.platform.mapper.post.UserPostCollectionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * UserPostCollectService
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserPostCollectService {

    private final UserPostCollectMapper userPostCollectMapper;
    private final UserPostCollectionMapper userPostCollectionMapper;
    private final PostMapper postMapper;

    /* ---------- 增 ---------- */
    @Transactional
    public UserPostCollect collectPost(Long userId, Long postId, Long collectionId) {
        // 检查是否已收藏（包括已删除的）
        boolean existsIncludeDeleted = userPostCollectMapper.existsByUserIdAndPostIdIncludeDeleted(userId, postId);

        if (existsIncludeDeleted) {
            // 如果存在记录（包括已删除的），检查是否已收藏
            boolean isCurrentlyCollected = userPostCollectMapper.existsByUserIdAndPostId(userId, postId);
            if (isCurrentlyCollected) {
                log.warn("用户已收藏该博文，用户ID: {}, 博文ID: {}", userId, postId);
                throw new RuntimeException("已收藏该博文");
            } else {
                // 存在但已删除，恢复收藏
                LocalDateTime now = LocalDateTime.now();
                int rows = userPostCollectMapper.restoreCollect(userId, postId, now, String.valueOf(userId));
                if (rows > 0) {
                    // 更新博文收藏数 +1
                    postMapper.updateCollectCount(postId, 1, now, String.valueOf(userId));
                    log.info("用户恢复收藏博文成功，用户ID: {}, 博文ID: {}", userId, postId);
                    return userPostCollectMapper.selectByUserIdAndPostId(userId, postId);
                } else {
                    log.warn("恢复收藏失败，用户ID: {}, 博文ID: {}", userId, postId);
                    throw new RuntimeException("恢复收藏失败");
                }
            }
        }

        // 验证收藏夹ID（如果不是默认收藏夹0）
        if (collectionId != null && collectionId != 0L) {
            var collection = userPostCollectionMapper.selectById(collectionId);
            if (collection == null || !collection.getUserId().equals(userId)) {
                log.warn("收藏失败，无效的收藏夹ID，用户ID: {}, 收藏夹ID: {}", userId, collectionId);
                throw new RuntimeException("收藏夹不存在或无权限访问");
            }
        }

        // 获取博文标题作为快照
        Post post = postMapper.selectById(postId);
        if (post == null) {
            log.warn("收藏失败，博文不存在，博文ID: {}", postId);
            throw new RuntimeException("博文不存在");
        }

        LocalDateTime now = LocalDateTime.now();
        UserPostCollect collect = UserPostCollect.builder()
                .userId(userId)
                .postId(postId)
                .collectionId(collectionId != null ? collectionId : 0L)
                .postTitle(post.getTitle())
                .createdAt(now)
                .updatedAt(now)
                .createdBy(String.valueOf(userId))
                .updatedBy(String.valueOf(userId))
                .build();

        userPostCollectMapper.insert(collect);

        // 更新博文收藏数 +1
        postMapper.updateCollectCount(postId, 1, now, String.valueOf(userId));

        log.info("用户收藏博文成功，用户ID: {}, 博文ID: {}, 收藏夹ID: {}, 收藏ID: {}", userId, postId, collectionId, collect.getId());
        return collect;
    }

    /* ---------- 删 ---------- */
    @Transactional
    public boolean uncollectPost(Long userId, Long postId) {
        int rows = userPostCollectMapper.deleteByUserIdAndPostId(userId, postId);
        if (rows > 0) {
            // 更新博文收藏数 -1
            postMapper.updateCollectCount(postId, -1, LocalDateTime.now(), String.valueOf(userId));
            log.info("用户取消收藏成功，用户ID: {}, 博文ID: {}", userId, postId);
            return true;
        } else {
            log.warn("取消收藏失败，用户ID: {}, 博文ID: {}，可能未收藏", userId, postId);
            return false;
        }
    }

    /* ---------- 查 ---------- */
    public UserPostCollect getCollectByUserIdAndPostId(Long userId, Long postId) {
        return userPostCollectMapper.selectByUserIdAndPostId(userId, postId);
    }

    public boolean isCollected(Long userId, Long postId) {
        return userPostCollectMapper.existsByUserIdAndPostId(userId, postId);
    }

    /* ---------- 列表/分页 ---------- */
    /**
     * 分页查询用户收藏列表
     */
    public PageResult<UserPostCollect> pageUserCollects(Long userId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<UserPostCollect> rows = userPostCollectMapper.selectByUserId(userId, offset, pageSize);
        long total = userPostCollectMapper.countByUserId(userId);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 分页查询用户指定收藏夹的收藏
     */
    public PageResult<UserPostCollect> pageUserCollectsByCollection(Long userId, Long collectionId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<UserPostCollect> rows = userPostCollectMapper.selectByUserIdAndCollectionId(userId, collectionId, offset, pageSize);
        long total = userPostCollectMapper.countByUserIdAndCollectionId(userId, collectionId);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /* ---------- 计数 ---------- */
    public long countUserCollects(Long userId) {
        long count = userPostCollectMapper.countByUserId(userId);
        log.info("统计用户收藏数量，用户ID: {} , 结果: {}", userId, count);
        return count;
    }
}