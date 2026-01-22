package com.bryan.platform.controller.post;

import com.bryan.platform.domain.converter.PostConverter;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.enums.HttpStatus;
import com.bryan.platform.domain.enums.post.CommentAreaStatusEnum;
import com.bryan.platform.domain.enums.post.PostStatusEnum;
import com.bryan.platform.domain.request.post.PostCreateRequest;
import com.bryan.platform.domain.request.post.PostUpdateRequest;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.response.Result;
import com.bryan.platform.domain.vo.post.PostVO;
import com.bryan.platform.service.auth.AuthService;
import com.bryan.platform.service.post.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * PostController
 *
 * @author Bryan Long
 */
@Validated
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final AuthService authService;
    private final com.bryan.platform.service.post.UserPostLikeService userPostLikeService;

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<Post>> getAllPosts(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        // 1. 调用服务层获取所有用户列表
        return Result.success(postService.pageAllPosts(pageNum, pageSize));
    }

    /**
     * 全站已发布文章分页列表（任何用户可见）
     */
    @GetMapping("/published")
    public Result<PageResult<PostVO>> getAllPublishedPosts(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {

        PageResult<Post> page = postService.pageAllPublishedPosts(pageNum, pageSize);
        List<PostVO> rows = page.getRows()
                .stream()
                .map(PostConverter::toPostVO)
                .toList();
        return Result.success(
                PageResult.of(rows, page.getTotal(), page.getPageNum(), page.getPageSize()));
    }

    @GetMapping("/{userId}/all")
    public  Result<PageResult<PostVO>> getAllPostsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<Post> page = postService.pageUserPosts(userId, pageNum, pageSize);
        List<PostVO> rows = page.getRows().stream()
                .map(PostConverter::toPostVO)
                .toList();
        return Result.success(PageResult.of(rows, page.getTotal(),
                page.getPageNum(), page.getPageSize()));
    }

    @GetMapping("/{userId}/audit/all")
    public Result<PageResult<PostVO>> getPostAuditVosByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(postService.pageUserPostAuditVos(userId, pageNum, pageSize));
    }

    @GetMapping("/{userId}/published")
    public  Result<PageResult<PostVO>> getPublishedPostsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<Post> page = postService.pageUserPublishedPosts(userId, pageNum, pageSize);
        List<PostVO> rows = page.getRows().stream()
                .map(PostConverter::toPostVO)
                .toList();
        return Result.success(PageResult.of(rows, page.getTotal(),
                page.getPageNum(), page.getPageSize()));
    }

    @GetMapping("/{id}")
    public Result<PostVO> getPostById(@PathVariable Long id) {
        Post post = postService.getPostById(id);
        if (post != null) {
            return Result.success(PostConverter.toPostVO(post));
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "文章不存在");
        }
    }

    @GetMapping("/audit/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PostVO> getPostAuditById(@PathVariable Long id) {
        Post post = postService.getPostById(id);
        if (post != null) {
            return Result.success(PostConverter.toPostVO(post));
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "文章不存在");
        }
    }

    /***
     * TODO 有待改进
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<PostVO>> searchPosts(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) PostStatusEnum status,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<Post> page = postService.searchPosts(title, author, tags, status, pageNum, pageSize);
        List<PostVO> rows = page.getRows().stream()
                .map(PostConverter::toPostVO)
                .toList();
        return Result.success(PageResult.of(rows, page.getTotal(),
                page.getPageNum(), page.getPageSize()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Post> createPost(@RequestBody PostCreateRequest request) {
        Long currentUserId = authService.getCurrentUserId();

        Post post = Post.builder()
                .userId(currentUserId)
                .title(request.getTitle())
                .content(request.getContent())
                .status(PostStatusEnum.AUDITING)
                .categoryId(request.getCategoryId())
                .tags(request.getTags())
                .commentAreaStatus(CommentAreaStatusEnum.OPEN)
                .build();

        Post createdPost = postService.createPost(post);
        return Result.success(createdPost);
    }

    @PostMapping("/draft")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Post> savePostDraft(@RequestBody PostCreateRequest request) {
        Long currentUserId = authService.getCurrentUserId();

        Post post = Post.builder()
                .userId(currentUserId)
                .title(request.getTitle())
                .content(request.getContent())
                .status(PostStatusEnum.DRAFT)
                .categoryId(request.getCategoryId())
                .tags(request.getTags())
                .commentAreaStatus(CommentAreaStatusEnum.OPEN)
                .build();

        Post createdPost = postService.createPost(post);
        return Result.success(createdPost);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Post> updatePost(@PathVariable Long id, @RequestBody PostUpdateRequest request) {
        Post post = Post.builder()
                .id(id)
                .title(request.getTitle())
                .content(request.getContent())
                .categoryId(request.getCategoryId())
                .tags(request.getTags())
                .commentAreaStatus(request.getCommentAreaStatus() != null ?
                        CommentAreaStatusEnum.valueOf(request.getCommentAreaStatus()) :
                        null)
                .weight(request.getWeight())
                .build();

        Post updatedPost = postService.updatePost(id, post);
        if (updatedPost != null) {
            return Result.success(updatedPost);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "更新失败，文章不存在");
        }
    }

    @PutMapping("/status/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public Result<Post> updatePostStatus(@PathVariable Long id, @RequestParam PostStatusEnum status) {
        Post post = postService.getPostById(id);
        if (post != null) {
            post.setStatus(status);
            return Result.success(postService.updatePost(id, post));
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "更新失败，文章不存在");
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> deletePost(@PathVariable Long id) {
        boolean deleted = postService.deletePost(id);
        if (deleted) {
            return Result.success(true);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "删除失败，文章不存在");
        }
    }

    /**
     * 点赞博文
     */
    @PostMapping("/{id}/like")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> likePost(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        try {
            boolean ok = userPostLikeService.likePost(currentUserId, id);
            return Result.success(ok);
        } catch (RuntimeException e) {
            return Result.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 取消点赞
     */
    @PostMapping("/{id}/unlike")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> unlikePost(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        boolean ok = userPostLikeService.unlikePost(currentUserId, id);
        if (ok) {
            return Result.success(true);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "取消点赞失败，可能未点赞");
        }
    }

    /**
     * 检查是否已点赞
     */
    @GetMapping("/{id}/like/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> checkLikeStatus(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        boolean liked = userPostLikeService.isLiked(currentUserId, id);
        return Result.success(liked);
    }
}
