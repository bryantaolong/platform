package com.bryan.platform.controller.post;

import com.bryan.platform.domain.converter.CommentConverter;
import com.bryan.platform.domain.entity.post.PostComment;
import com.bryan.platform.domain.enums.HttpStatus;
import com.bryan.platform.domain.request.post.CommentCreateRequest;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.response.Result;
import com.bryan.platform.domain.vo.post.CommentVO;
import com.bryan.platform.service.auth.AuthService;
import com.bryan.platform.service.post.PostCommentService;
import com.bryan.platform.service.post.UserCommentLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * PostCommentController
 *
 * @author Bryan Long
 */
@Validated
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class PostCommentController {

    private final PostCommentService postCommentService;
    private final AuthService authService;
    private final UserCommentLikeService userCommentLikeService;

    @GetMapping("/post/{postId}")
    public Result<List<CommentVO>> getCommentsByPostId(@PathVariable Long postId) {
        List<PostComment> comments = postCommentService.getCommentsByPostId(postId);
        List<CommentVO> commentVOs = comments.stream()
                .map(CommentConverter::toCommentVO)
                .toList();
        return Result.success(commentVOs);
    }

    @GetMapping("/post/{postId}/page")
    public Result<PageResult<CommentVO>> pageCommentsByPostId(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<PostComment> page = postCommentService.pageCommentsByPostId(postId, pageNum, pageSize);
        List<CommentVO> rows = page.getRows().stream()
                .map(CommentConverter::toCommentVO)
                .toList();
        return Result.success(PageResult.of(rows, page.getTotal(), page.getPageNum(), page.getPageSize()));
    }

    @GetMapping("/post/{postId}/tree")
    public Result<List<CommentVO>> getCommentTree(@PathVariable Long postId) {
        List<CommentVO> tree = postCommentService.getCommentTree(postId);
        return Result.success(tree);
    }

    @GetMapping("/{commentId}/replies")
    public Result<List<CommentVO>> getRepliesByCommentId(@PathVariable Long commentId) {
        List<PostComment> replies = postCommentService.getRepliesByCommentId(commentId);
        List<CommentVO> replyVOs = replies.stream()
                .map(CommentConverter::toCommentVO)
                .toList();
        return Result.success(replyVOs);
    }

    @GetMapping("/post/{postId}/hot")
    public Result<List<CommentVO>> getHotComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "10") int limit) {
        List<PostComment> comments = postCommentService.getHotComments(postId, limit);
        List<CommentVO> commentVOs = comments.stream()
                .map(CommentConverter::toCommentVO)
                .toList();
        return Result.success(commentVOs);
    }

    @GetMapping("/post/{postId}/latest")
    public Result<List<CommentVO>> getLatestComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "10") int limit) {
        List<PostComment> comments = postCommentService.getLatestComments(postId, limit);
        List<CommentVO> commentVOs = comments.stream()
                .map(CommentConverter::toCommentVO)
                .toList();
        return Result.success(commentVOs);
    }

    @GetMapping("/{id}")
    public Result<CommentVO> getCommentById(@PathVariable Long id) {
        PostComment comment = postCommentService.getCommentById(id);
        if (comment != null) {
            return Result.success(CommentConverter.toCommentVO(comment));
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "评论不存在");
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<CommentVO> createComment(@RequestBody CommentCreateRequest request) {
        Long currentUserId = authService.getCurrentUserId();
        PostComment comment = postCommentService.createComment(
                currentUserId,
                request.getPostId(),
                request.getParentId(),
                request.getReplyToUserId(),
                request.getContent()
        );
        return Result.success(CommentConverter.toCommentVO(comment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> deleteComment(@PathVariable Long id) {
        boolean deleted = postCommentService.deleteComment(id);
        if (deleted) {
            return Result.success(true);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "删除失败，评论不存在");
        }
    }

    @PostMapping("/{id}/like")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> likeComment(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        try {
            boolean ok = userCommentLikeService.likeComment(currentUserId, id);
            return Result.success(ok);
        } catch (RuntimeException e) {
            return Result.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/{id}/unlike")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> unlikeComment(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        boolean ok = userCommentLikeService.unlikeComment(currentUserId, id);
        if (ok) {
            return Result.success(true);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "取消点赞失败，可能未点赞");
        }
    }

    @GetMapping("/{id}/like/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public Result<Boolean> checkLikeStatus(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        boolean liked = userCommentLikeService.isLiked(currentUserId, id);
        return Result.success(liked);
    }
}
