package com.bryan.platform.service.post;

import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.entity.post.UserPostCollect;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.mapper.post.PostMapper;
import com.bryan.platform.mapper.post.UserPostCollectMapper;
import com.bryan.platform.mapper.post.UserPostCollectionMapper;
import com.bryan.platform.service.user.UserBehaviorService;
import com.bryan.platform.service.user.UserInterestProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户博文收藏业务服务
 * 提供收藏、取消收藏、分页查询及计数能力，支持收藏夹维度筛选。
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
    private final UserBehaviorService userBehaviorService;
    private final UserInterestProfileService userInterestProfileService;

    /**
     * 收藏博文（幂等）
     * 若已存在软删记录则恢复；否则新增。默认收藏夹 ID 为 0 表示"未分类"。
     *
     * @param userId       用户主键
     * @param postId       博文主键
     * @param collectionId 收藏夹主键（可空，0 表示默认）
     * @return 已持久化的收藏记录
     * @throws RuntimeException 已收藏、博文不存在、收藏夹无权访问等
     */
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
                int rows = userPostCollectMapper.restoreCollect(userId, postId);
                if (rows > 0) {
                    // 更新博文收藏数 +1
                    postMapper.updateCollectCount(postId, 1);
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

        UserPostCollect collect = UserPostCollect.builder()
                .userId(userId)
                .postId(postId)
                .collectionId(collectionId != null ? collectionId : 0L)
                .postTitle(post.getTitle())
                .build();

        userPostCollectMapper.insert(collect);

        // 更新博文收藏数 +1
        postMapper.updateCollectCount(postId, 1);

        // 记录收藏行为
        userBehaviorService.recordCollect(userId, postId);

        // 异步更新用户画像
        try {
            userInterestProfileService.updateUserProfile(userId);
        } catch (Exception e) {
            log.warn("更新用户画像失败，userId: {}", userId, e);
        }

        log.info("用户收藏博文成功，用户ID: {}, 博文ID: {}, 收藏夹ID: {}, 收藏ID: {}", userId, postId, collectionId, collect.getId());
        return collect;
    }

    /**
     * 根据用户与博文查询单条收藏记录
     *
     * @param userId 用户主键
     * @param postId 博文主键
     * @return 收藏记录；不存在返回 null
     */
    public UserPostCollect getCollectByUserIdAndPostId(Long userId, Long postId) {
        return userPostCollectMapper.selectByUserIdAndPostId(userId, postId);
    }

    /**
     * 判断用户是否已收藏指定博文
     *
     * @param userId 用户主键
     * @param postId 博文主键
     * @return true 已收藏；false 未收藏
     */
    public boolean isCollected(Long userId, Long postId) {
        return userPostCollectMapper.existsByUserIdAndPostId(userId, postId);
    }

    /**
     * 分页查询用户全部收藏
     *
     * @param userId   用户主键
     * @param pageNum  当前页码（从 1 开始）
     * @param pageSize 每页条数
     * @return 收藏记录分页结果
     */
    public PageResult<UserPostCollect> pageUserCollects(Long userId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<UserPostCollect> rows = userPostCollectMapper.selectByUserId(userId, offset, pageSize);
        long total = userPostCollectMapper.countByUserId(userId);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 分页查询用户指定收藏夹的收藏
     *
     * @param userId       用户主键
     * @param collectionId 收藏夹主键
     * @param pageNum      当前页码
     * @param pageSize     每页条数
     * @return 收藏记录分页结果
     */
    public PageResult<UserPostCollect> pageUserCollectsByCollection(Long userId, Long collectionId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<UserPostCollect> rows = userPostCollectMapper.selectByUserIdAndCollectionId(userId, collectionId, offset, pageSize);
        long total = userPostCollectMapper.countByUserIdAndCollectionId(userId, collectionId);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 统计用户收藏总数
     *
     * @param userId 用户主键
     * @return 收藏数量
     */
    public long countUserCollects(Long userId) {
        long count = userPostCollectMapper.countByUserId(userId);
        log.info("统计用户收藏数量，用户ID: {} , 结果: {}", userId, count);
        return count;
    }

    /**
     * 取消收藏（逻辑删除）
     * 同时减少博文收藏计数
     *
     * @param userId 用户主键
     * @param postId 博文主键
     * @return 是否取消成功
     */
    @Transactional
    public boolean cancelCollectPost(Long userId, Long postId) {
        int rows = userPostCollectMapper.deleteByUserIdAndPostId(userId, postId);
        if (rows > 0) {
            // 更新博文收藏数 -1
            postMapper.updateCollectCount(postId, -1);
            log.info("用户取消收藏成功，用户ID: {}, 博文ID: {}", userId, postId);
            return true;
        } else {
            log.warn("取消收藏失败，用户ID: {}, 博文ID: {}，可能未收藏", userId, postId);
            return false;
        }
    }
}
