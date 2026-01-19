package com.bryan.platform.controller.post;

import com.bryan.platform.domain.entity.post.UserPostCollect;
import com.bryan.platform.domain.enums.HttpStatus;
import com.bryan.platform.domain.request.post.UserPostCollectRequest;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.response.Result;
import com.bryan.platform.service.auth.AuthService;
import com.bryan.platform.service.post.UserPostCollectService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * UserPostCollectController
 *
 * @author Bryan Long
 */
@Validated
@RestController
@RequestMapping("/api/user/post-collects")
@RequiredArgsConstructor
public class UserPostCollectController {

    private final UserPostCollectService userPostCollectService;
    private final AuthService authService;

    /**
     * 收藏博文
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<UserPostCollect> collectPost(@RequestBody @Validated UserPostCollectRequest request) {
        Long currentUserId = authService.getCurrentUserId();

        try {
            UserPostCollect collect = userPostCollectService.collectPost(
                    currentUserId,
                    request.getPostId(),
                    request.getCollectionId()
            );
            return Result.success(collect);
        } catch (RuntimeException e) {
            return Result.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 取消收藏博文
     */
    @DeleteMapping("/{postId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> uncollectPost(@PathVariable Long postId) {
        Long currentUserId = authService.getCurrentUserId();

        boolean success = userPostCollectService.uncollectPost(currentUserId, postId);
        if (success) {
            return Result.success(true);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "取消收藏失败，可能未收藏该博文");
        }
    }

    /**
     * 获取指定用户的收藏列表
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<PageResult<UserPostCollect>> getUserCollectsByUserId(
            @PathVariable Long userId,
            @RequestParam(required = false) Long collectionId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        
        PageResult<UserPostCollect> page;
        if (collectionId != null && collectionId != 0L) {
            page = userPostCollectService.pageUserCollectsByCollection(userId, collectionId, pageNum, pageSize);
        } else {
            page = userPostCollectService.pageUserCollects(userId, pageNum, pageSize);
        }
        return Result.success(page);
    }

    /**
     * 获取当前用户收藏列表
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<PageResult<UserPostCollect>> getUserCollects(
            @RequestParam(required = false) Long collectionId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Long currentUserId = authService.getCurrentUserId();
        return getUserCollectsByUserId(currentUserId, collectionId, pageNum, pageSize);
    }


    /**
     * 获取用户指定收藏夹的收藏
     */
    @GetMapping("/collection/{collectionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<PageResult<UserPostCollect>> getUserCollectsByCollection(
            @PathVariable Long collectionId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Long currentUserId = authService.getCurrentUserId();

        PageResult<UserPostCollect> page = userPostCollectService.pageUserCollectsByCollection(
                currentUserId, collectionId, pageNum, pageSize);
        return Result.success(page);
    }

    /**
     * 检查是否已收藏指定博文
     */
    @GetMapping("/{postId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> checkCollectStatus(@PathVariable Long postId) {
        Long currentUserId = authService.getCurrentUserId();

        boolean isCollected = userPostCollectService.isCollected(currentUserId, postId);
        return Result.success(isCollected);
    }

    /**
     * 获取用户收藏数量
     */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Long> getUserCollectCount() {
        Long currentUserId = authService.getCurrentUserId();

        long count = userPostCollectService.countUserCollects(currentUserId);
        return Result.success(count);
    }
}