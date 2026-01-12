package com.bryan.platform.service.post;

import com.bryan.platform.domain.entity.post.UserPostCollection;
import com.bryan.platform.mapper.post.UserPostCollectionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * UserPostCollectionService
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserPostCollectionService {

    private final UserPostCollectionMapper userPostCollectionMapper;

    /* ---------- 增 ---------- */
    @Transactional
    public UserPostCollection createCollection(Long userId, String folderName) {
        // 检查是否已存在同名收藏夹
        if (userPostCollectionMapper.existsByUserIdAndFolderName(userId, folderName)) {
            log.warn("用户收藏夹已存在，用户ID: {}, 文件夹名: {}", userId, folderName);
            throw new RuntimeException("收藏夹名称已存在");
        }

        UserPostCollection collection = UserPostCollection.builder()
                .userId(userId)
                .folderName(folderName)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(String.valueOf(userId))
                .updatedBy(String.valueOf(userId))
                .build();

        userPostCollectionMapper.insert(collection);
        log.info("创建收藏夹成功，用户ID: {}, 文件夹名: {}, 收藏夹ID: {}", userId, folderName, collection.getId());
        return collection;
    }

    /* ---------- 删 ---------- */
    @Transactional
    public boolean deleteCollection(Long collectionId) {
        int rows = userPostCollectionMapper.deleteById(collectionId);
        if (rows > 0) {
            log.info("删除收藏夹成功，收藏夹ID: {}", collectionId);
            return true;
        } else {
            log.warn("删除收藏夹失败，收藏夹ID: {}，可能不存在", collectionId);
            return false;
        }
    }

    /* ---------- 改 ---------- */
    @Transactional
    public UserPostCollection updateCollection(Long collectionId, String newFolderName) {
        UserPostCollection existing = userPostCollectionMapper.selectById(collectionId);
        if (existing == null) {
            log.warn("更新收藏夹失败，收藏夹不存在，ID: {}", collectionId);
            throw new RuntimeException("收藏夹不存在");
        }

        // 检查新名称是否已被使用（排除自己）
        UserPostCollection duplicate = userPostCollectionMapper.selectByUserIdAndFolderName(
                existing.getUserId(), newFolderName);
        if (duplicate != null && !duplicate.getId().equals(collectionId)) {
            log.warn("更新收藏夹失败，新文件夹名已存在，用户ID: {}, 文件夹名: {}", existing.getUserId(), newFolderName);
            throw new RuntimeException("收藏夹名称已存在");
        }

        existing.setFolderName(newFolderName);
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(String.valueOf(existing.getUserId()));

        int rows = userPostCollectionMapper.update(existing);
        if (rows == 0) {
            log.warn("更新收藏夹失败，ID: {} , 可能已被修改或不存在", existing.getId());
            throw new RuntimeException("更新失败，数据已被修改或不存在");
        }

        log.info("更新收藏夹成功，收藏夹ID: {}, 新文件夹名: {}", collectionId, newFolderName);
        return existing;
    }

    /* ---------- 查 ---------- */
    public UserPostCollection getCollectionById(Long collectionId) {
        UserPostCollection collection = userPostCollectionMapper.selectById(collectionId);
        if (collection == null) {
            log.warn("查询收藏夹不存在，ID: {}", collectionId);
        }
        return collection;
    }

    public List<UserPostCollection> getUserCollections(Long userId) {
        List<UserPostCollection> collections = userPostCollectionMapper.selectByUserId(userId);
        log.info("获取用户收藏夹列表完成，用户ID: {} , 数量: {}", userId, collections.size());
        return collections;
    }

    public UserPostCollection getCollectionByUserIdAndName(Long userId, String folderName) {
        return userPostCollectionMapper.selectByUserIdAndFolderName(userId, folderName);
    }

    /* ---------- 计数 ---------- */
    public long countUserCollections(Long userId) {
        long count = userPostCollectionMapper.countByUserId(userId);
        log.info("统计用户收藏夹数量，用户ID: {} , 结果: {}", userId, count);
        return count;
    }
}