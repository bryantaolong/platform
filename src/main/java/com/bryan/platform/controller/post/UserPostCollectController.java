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
 * 用户博文收藏控制器
 * 提供收藏、取消收藏、分页查询收藏列表等接口。
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
     *
     * @param request 收藏请求参数（博文 ID、收藏夹 ID）
     * @return 收藏记录实体
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
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
     *
     * @param postId 博文主键
     * @return 是否取消成功
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
     * 分页查询指定用户的收藏列表
     * 支持按收藏夹筛选
     *
     * @param userId       用户主键
     * @param collectionId 收藏夹 ID（可选）
     * @param pageNum      当前页码
     * @param pageSize     每页条数
     * @return 收藏记录分页结果
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
     * 获取当前登录用户的收藏列表
     * 支持按收藏夹筛选
     *
     * @param collectionId 收藏夹 ID（可选）
     * @param pageNum      当前页码
     * @param pageSize     每页条数
     * @return 收藏记录分页结果
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
     * 分页查询当前用户指定收藏夹的收藏
     *
     * @param collectionId 收藏夹主键
     * @param pageNum      当前页码
     * @param pageSize     每页条数
     * @return 收藏记录分页结果
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
     * 检查当前用户是否已收藏指定博文
     *
     * @param postId 博文主键
     * @return true 已收藏；false 未收藏
     */
    @GetMapping("/{postId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> checkCollectStatus(@PathVariable Long postId) {
        Long currentUserId = authService.getCurrentUserId();

        boolean isCollected = userPostCollectService.isCollected(currentUserId, postId);
        return Result.success(isCollected);
    }

    /**
     * 获取当前用户收藏总数
     *
     * @return 收藏数量
     */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Long> getUserCollectCount() {
        Long currentUserId = authService.getCurrentUserId();

        long count = userPostCollectService.countUserCollects(currentUserId);
        return Result.success(count);
    }
}