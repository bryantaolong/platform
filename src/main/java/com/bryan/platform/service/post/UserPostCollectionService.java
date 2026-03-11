package com.bryan.platform.service.post;

import com.bryan.platform.domain.entity.post.UserPostCollection;
import com.bryan.platform.exception.BusinessException;
import com.bryan.platform.mapper.post.UserPostCollectionMapper;
import com.bryan.platform.util.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户博文收藏夹业务服务
 * 提供收藏夹的创建、删除、更新、查询及计数能力。
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserPostCollectionService {

    private final UserPostCollectionMapper userPostCollectionMapper;

    /**
     * 创建收藏夹
     * 同名检测：同一用户下不允许重名
     *
     * @param userId     用户主键
     * @param folderName 收藏夹名称
     * @return 已持久化的收藏夹实体
     * @throws RuntimeException 名称冲突或数据库异常
     */
    @Transactional
    public UserPostCollection createCollection(Long userId, String folderName) {
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

    /**
     * 根据主键查询收藏夹
     *
     * @param collectionId 收藏夹主键
     * @return 收藏夹实体；不存在返回 null
     */
    public UserPostCollection getCollectionById(Long collectionId) {
        UserPostCollection collection = userPostCollectionMapper.selectById(collectionId);
        if (collection == null) {
            log.warn("查询收藏夹不存在，ID: {}", collectionId);
        }
        return collection;
    }

    /**
     * 获取指定用户的全部收藏夹
     *
     * @param userId 用户主键
     * @return 收藏夹列表
     */
    public List<UserPostCollection> listUserCollections(Long userId) {
        List<UserPostCollection> collections = userPostCollectionMapper.selectByUserId(userId);
        log.info("获取用户收藏夹列表完成，用户ID: {} , 数量: {}", userId, collections.size());
        return collections;
    }

    /**
     * 根据用户与名称查询收藏夹
     * 主要用于重名校验
     *
     * @param userId     用户主键
     * @param folderName 收藏夹名称
     * @return 收藏夹实体；不存在返回 null
     */
    public UserPostCollection getCollectionByUserIdAndName(Long userId, String folderName) {
        return userPostCollectionMapper.selectByUserIdAndFolderName(userId, folderName);
    }

    /**
     * 统计指定用户的收藏夹数量
     *
     * @param userId 用户主键
     * @return 收藏夹数量
     */
    public long countUserCollections(Long userId) {
        long count = userPostCollectionMapper.countByUserId(userId);
        log.info("统计用户收藏夹数量，用户ID: {} , 结果: {}", userId, count);
        return count;
    }

    /**
     * 更新收藏夹名称
     * 同名检测：排除自身后仍重名则拒绝
     *
     * @param collectionId 收藏夹主键
     * @param newFolderName 新名称
     * @return 更新后的收藏夹实体
     * @throws RuntimeException 收藏夹不存在或名称冲突
     */
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

    /**
     * 删除收藏夹（逻辑删除）
     *
     * @param userId 用户 ID
     * @param collectionId 收藏夹主键
     * @return 是否删除成功
     */
    @Transactional
    public boolean deleteCollection(Long userId, Long collectionId) {
        UserPostCollection collection = userPostCollectionMapper.selectById(collectionId);

        if(!collection.getUserId().equals(userId)) {
            log.error("用户 {} 尝试删除无权限的收藏夹 {}", userId, collectionId);
            throw new BusinessException("用户尝试删除无权限的收藏夹");
        }

        int rows = userPostCollectionMapper.deleteById(
                collectionId,
                collection.getVersion(),
                LocalDateTime.now(),
                JwtUtils.getCurrentUsername()
        );
        if (rows > 0) {
            log.info("删除收藏夹成功，收藏夹ID: {}", collectionId);
            return true;
        } else {
            log.warn("删除收藏夹失败，收藏夹ID: {}，可能已被其他用户修改", collectionId);
            return false;
        }
    }
}
