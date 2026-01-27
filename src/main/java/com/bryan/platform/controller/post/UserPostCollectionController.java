package com.bryan.platform.controller.post;

import com.bryan.platform.domain.entity.post.UserPostCollection;
import com.bryan.platform.domain.enums.HttpStatus;
import com.bryan.platform.domain.response.Result;
import com.bryan.platform.service.auth.AuthService;
import com.bryan.platform.service.post.UserPostCollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户博文收藏夹控制器
 * 提供收藏夹的增删改查及数量统计接口。
 *
 * @author Bryan Long
 */
@Validated
@RestController
@RequestMapping("/api/user/post-collections")
@RequiredArgsConstructor
public class UserPostCollectionController {

    private final UserPostCollectionService userPostCollectionService;
    private final AuthService authService;

    /**
     * 创建收藏夹
     *
     * @param folderName 收藏夹名称
     * @return 创建后的收藏夹实体
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Result<UserPostCollection> createCollection(@RequestParam @Validated String folderName) {
        Long currentUserId = authService.getCurrentUserId();

        try {
            UserPostCollection collection = userPostCollectionService.createCollection(
                    currentUserId, folderName);
            return Result.success(collection);
        } catch (RuntimeException e) {
            return Result.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 获取当前登录用户的全部收藏夹
     *
     * @return 收藏夹列表
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Result<List<UserPostCollection>> getUserCollections() {
        Long currentUserId = authService.getCurrentUserId();

        List<UserPostCollection> collections = userPostCollectionService.getUserCollections(currentUserId);
        return Result.success(collections);
    }

    /**
     * 获取指定用户的全部收藏夹（用户主页可见）
     *
     * @param userId 用户主键
     * @return 收藏夹列表
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public Result<List<UserPostCollection>> getUserCollectionsByUserId(@PathVariable Long userId) {
        List<UserPostCollection> collections = userPostCollectionService.getUserCollections(userId);
        return Result.success(collections);
    }

    /**
     * 根据主键查询单个收藏夹详情
     *
     * @param collectionId 收藏夹主键
     * @return 收藏夹实体或错误提示
     */
    @GetMapping("/{collectionId}")
    @PreAuthorize("isAuthenticated()")
    public Result<UserPostCollection> getCollectionById(@PathVariable Long collectionId) {
        UserPostCollection collection = userPostCollectionService.getCollectionById(collectionId);
        if (collection != null) {
            return Result.success(collection);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "收藏夹不存在");
        }
    }

    /**
     * 获取当前用户收藏夹数量
     *
     * @return 收藏夹数量
     */
    @GetMapping("/count")
    @PreAuthorize("isAuthenticated()")
    public Result<Long> getUserCollectionCount() {
        Long currentUserId = authService.getCurrentUserId();

        long count = userPostCollectionService.countUserCollections(currentUserId);
        return Result.success(count);
    }

    /**
     * 更新收藏夹名称
     *
     * @param collectionId 收藏夹主键
     * @param folderName   新名称
     * @return 更新后的收藏夹实体
     */
    @PutMapping("/{collectionId}")
    @PreAuthorize("isAuthenticated()")
    public Result<UserPostCollection> updateCollection(
            @PathVariable Long collectionId,
            @RequestParam @Validated String folderName) {
        try {
            UserPostCollection collection = userPostCollectionService.updateCollection(
                    collectionId, folderName);
            return Result.success(collection);
        } catch (RuntimeException e) {
            return Result.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 删除收藏夹
     *
     * @param collectionId 收藏夹主键
     * @return 是否删除成功
     */
    @DeleteMapping("/{collectionId}")
    @PreAuthorize("isAuthenticated()")
    public Result<Boolean> deleteCollection(@PathVariable Long collectionId) {
        Long userId = authService.getCurrentUserId();
        boolean success = userPostCollectionService.deleteCollection(userId, collectionId);
        if (success) {
            return Result.success(true);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "删除失败，收藏夹不存在");
        }
    }
}
