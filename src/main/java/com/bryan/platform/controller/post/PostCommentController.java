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
 * 评论管理控制器
 * 提供帖子评论的增删改查、点赞、树形展示等功能。
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

    /**
     * 根据帖子 ID 查询全部评论列表（平铺）
     *
     * @param postId 帖子主键
     * @return 评论 VO 列表
     */
    @GetMapping("/post/{postId}")
    @PreAuthorize("permitAll()")
    public Result<List<CommentVO>> getCommentsByPostId(@PathVariable Long postId) {
        List<PostComment> comments = postCommentService.getCommentsByPostId(postId);
        List<CommentVO> commentVOs = comments.stream()
                .map(CommentConverter::toCommentVO)
                .toList();
        return Result.success(commentVOs);
    }

    /**
     * 分页查询指定帖子的评论
     *
     * @param postId   帖子主键
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 分页结果
     */
    @GetMapping("/post/{postId}/page")
    @PreAuthorize("permitAll()")
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

    /**
     * 获取指定帖子的评论树（含父子层级）
     *
     * @param postId 帖子主键
     * @return 树形评论 VO 列表
     */
    @GetMapping("/post/{postId}/tree")
    @PreAuthorize("permitAll()")
    public Result<List<CommentVO>> getCommentTree(@PathVariable Long postId) {
        List<CommentVO> tree = postCommentService.getCommentTree(postId);
        return Result.success(tree);
    }

    /**
     * 查询某条评论的直接回复列表
     *
     * @param commentId 父评论 ID
     * @return 回复列表
     */
    @GetMapping("/{commentId}/replies")
    @PreAuthorize("permitAll()")
    public Result<List<CommentVO>> getRepliesByCommentId(@PathVariable Long commentId) {
        List<PostComment> replies = postCommentService.getRepliesByCommentId(commentId);
        List<CommentVO> replyVOs = replies.stream()
                .map(CommentConverter::toCommentVO)
                .toList();
        return Result.success(replyVOs);
    }

    /**
     * 查询热门评论（按点赞数倒序）
     *
     * @param postId 帖子主键
     * @param limit  返回条数
     * @return 热门评论列表
     */
    @GetMapping("/post/{postId}/hot")
    @PreAuthorize("permitAll()")
    public Result<List<CommentVO>> getHotComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "10") int limit) {
        List<PostComment> comments = postCommentService.getHotComments(postId, limit);
        List<CommentVO> commentVOs = comments.stream()
                .map(CommentConverter::toCommentVO)
                .toList();
        return Result.success(commentVOs);
    }

    /**
     * 查询最新评论（按创建时间倒序）
     *
     * @param postId 帖子主键
     * @param limit  返回条数
     * @return 最新评论列表
     */
    @GetMapping("/post/{postId}/latest")
    @PreAuthorize("permitAll()")
    public Result<List<CommentVO>> getLatestComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "10") int limit) {
        List<PostComment> comments = postCommentService.getLatestComments(postId, limit);
        List<CommentVO> commentVOs = comments.stream()
                .map(CommentConverter::toCommentVO)
                .toList();
        return Result.success(commentVOs);
    }

    /**
     * 根据主键查询单条评论
     *
     * @param id 评论主键
     * @return 评论 VO 或错误提示
     */
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public Result<CommentVO> getCommentById(@PathVariable Long id) {
        PostComment comment = postCommentService.getCommentById(id);
        if (comment != null) {
            return Result.success(CommentConverter.toCommentVO(comment));
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "评论不存在");
        }
    }

    /**
     * 创建评论
     *
     * @param request 创建参数
     * @return 创建后的评论 VO
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
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

    /**
     * 删除评论（软删）
     *
     * @param id 评论主键
     * @return 是否删除成功
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<Boolean> deleteComment(@PathVariable Long id) {
        boolean deleted = postCommentService.deleteComment(id);
        if (deleted) {
            return Result.success(true);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "删除失败，评论不存在");
        }
    }

    /**
     * 点赞评论
     *
     * @param id 评论主键
     * @return 是否点赞成功
     */
    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public Result<Boolean> likeComment(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        try {
            boolean ok = userCommentLikeService.likeComment(currentUserId, id);
            return Result.success(ok);
        } catch (RuntimeException e) {
            return Result.error(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 取消点赞评论
     *
     * @param id 评论主键
     * @return 是否取消成功
     */
    @PostMapping("/{id}/unlike")
    @PreAuthorize("isAuthenticated()")
    public Result<Boolean> unlikeComment(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        boolean ok = userCommentLikeService.unlikeComment(currentUserId, id);
        if (ok) {
            return Result.success(true);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "取消点赞失败，可能未点赞");
        }
    }

    /**
     * 查询当前用户对某条评论的点赞状态
     *
     * @param id 评论主键
     * @return true 已点赞；false 未点赞
     */
    @GetMapping("/{id}/like/status")
    @PreAuthorize("permitAll()")
    public Result<Boolean> checkLikeStatus(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        boolean liked = userCommentLikeService.isLiked(currentUserId, id);
        return Result.success(liked);
    }
}