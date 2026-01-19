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
 * UserPostCollectionController
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
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
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
     * 删除收藏夹
     */
    @DeleteMapping("/{collectionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> deleteCollection(@PathVariable Long collectionId) {
        // TODO: 可以添加权限检查，确保只能删除自己的收藏夹

        boolean success = userPostCollectionService.deleteCollection(collectionId);
        if (success) {
            return Result.success(true);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "删除失败，收藏夹不存在");
        }
    }

    /**
     * 更新收藏夹
     */
    @PutMapping("/{collectionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
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
     * 获取用户收藏夹列表
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<List<UserPostCollection>> getUserCollections() {
        Long currentUserId = authService.getCurrentUserId();

        List<UserPostCollection> collections = userPostCollectionService.getUserCollections(currentUserId);
        return Result.success(collections);
    }

    /**
     * 获取指定用户的收藏夹列表（用于在用户主页展示其收藏夹）
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<List<UserPostCollection>> getUserCollectionsByUserId(@PathVariable Long userId) {
        List<UserPostCollection> collections = userPostCollectionService.getUserCollections(userId);
        return Result.success(collections);
    }

    /**
     * 获取收藏夹详情
     */
    @GetMapping("/{collectionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<UserPostCollection> getCollectionById(@PathVariable Long collectionId) {
        UserPostCollection collection = userPostCollectionService.getCollectionById(collectionId);
        if (collection != null) {
            return Result.success(collection);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "收藏夹不存在");
        }
    }

    /**
     * 获取用户收藏夹数量
     */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Long> getUserCollectionCount() {
        Long currentUserId = authService.getCurrentUserId();

        long count = userPostCollectionService.countUserCollections(currentUserId);
        return Result.success(count);
    }
}