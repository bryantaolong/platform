package com.bryan.platform.controller.post;

import com.bryan.platform.domain.converter.PostConverter;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.enums.HttpStatus;
import com.bryan.platform.domain.enums.post.CommentAreaStatusEnum;
import com.bryan.platform.domain.enums.post.PostStatusEnum;
import com.bryan.platform.domain.request.post.PostSearchRequest;
import com.bryan.platform.domain.request.post.PostCreateRequest;
import com.bryan.platform.domain.request.post.PostUpdateRequest;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.response.Result;
import com.bryan.platform.domain.vo.post.PostSummaryVO;
import com.bryan.platform.domain.vo.post.PostVO;
import com.bryan.platform.service.auth.AuthService;
import com.bryan.platform.service.file.LocalFileService;
import com.bryan.platform.service.post.PostService;
import com.bryan.platform.service.post.UserPostLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 博文管理控制器
 * 提供博文的发布、编辑、审核、点赞、删除等后台与前台接口。
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
    private final UserPostLikeService userPostLikeService;
    private final LocalFileService localFileService;

    /**
     * 创建博文（提交审核）
     *
     * @param request 创建参数
     * @return 创建后的博文实体
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
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
                .weight(1)
                .build();

        Post createdPost = postService.createPost(post);
        return Result.success(createdPost);
    }

    /**
     * 保存博文草稿
     *
     * @param request 创建参数
     * @return 创建后的博文实体
     */
    @PostMapping("/draft")
    @PreAuthorize("isAuthenticated()")
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
                .weight(1)
                .build();

        Post createdPost = postService.createPost(post);
        return Result.success(createdPost);
    }

    /**
     * 上传博文图片
     *
     * 支持用户在编辑博文时上传图片，图片将保存到 uploads/post-images/ 目录
     * 返回图片URL，前端可将其插入到Markdown内容中
     *
     * TODO: 存在问题，当用户上传图片，但是未发布文章时，该图片会失去指向它的指针，图片会成为僵尸文件
     * TODO: 方案一：当前端发布博文界面意外关闭时，默认保存当前草稿。
     * TODO: 方案二：用户退出发布博文界面时，浏览器弹出窗口询问用户是否需要保存草稿
     *
     * @param file 图片文件
     * @return 图片访问URL
     */
    @PostMapping(value = "/upload/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public Result<Map<String, String>> uploadPostImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.error(HttpStatus.BAD_REQUEST, "文件不能为空");
        }

        try {
            // 只传递子目录，LocalFileService 会自动生成文件名
            String savedPath = localFileService.storeFile(file, "post-images");

            Map<String, String> result = new HashMap<>();
            result.put("url", savedPath);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(HttpStatus.INTERNAL_ERROR, "图片上传失败: " + e.getMessage());
        }
    }

    /**
     * 管理员分页查询所有博文（含草稿/已删除）
     *
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文实体分页结果
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public Result<PageResult<Post>> listAllPosts(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        // 1. 调用服务层获取所有用户列表
        return Result.success(postService.pageAllPosts(pageNum, pageSize));
    }

    /**
     * 全站已发布文章分页列表（任何用户可见）
     *
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文摘要 VO 分页结果
     */
    @GetMapping("/published")
    @PreAuthorize("permitAll()")
    public Result<PageResult<PostSummaryVO>> listAllPublishedPosts(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {

        PageResult<Post> page = postService.pageAllPublishedPosts(pageNum, pageSize);
        List<PostSummaryVO> rows = page.getRows()
                .stream()
                .map(PostConverter::toPostSummaryVO)
                .toList();
        return Result.success(
                PageResult.of(rows, page.getTotal(), page.getPageNum(), page.getPageSize()));
    }

    /**
     * 获取当前用户关注用户的已发布文章分页列表
     *
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文摘要 VO 分页结果
     */
    @GetMapping("/following")
    @PreAuthorize("isAuthenticated()")
    public Result<PageResult<PostSummaryVO>> listFollowedUsersPosts(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Long currentUserId = authService.getCurrentUserId();
        PageResult<Post> page = postService.pageFollowedUsersPosts(currentUserId, pageNum, pageSize);
        List<PostSummaryVO> rows = page.getRows()
                .stream()
                .map(PostConverter::toPostSummaryVO)
                .toList();
        return Result.success(
                PageResult.of(rows, page.getTotal(), page.getPageNum(), page.getPageSize()));
    }

    /**
     * 查询指定用户的全部博文（含草稿、已删除）
     *
     * @param userId   用户主键
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文 VO 分页结果
     */
    @GetMapping("/{userId}/all")
    @PreAuthorize("isAuthenticated()")
    public Result<PageResult<PostVO>> listAllPostsByUserId(
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

    /**
     * 查询指定用户已发布的博文
     *
     * @param userId   用户主键
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文 VO 分页结果
     */
    @GetMapping("/{userId}/published")
    @PreAuthorize("isAuthenticated()")
    public Result<PageResult<PostVO>> listPublishedPostsByUserId(
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

    /**
     * 根据主键查询单条博文
     *
     * @param id 博文主键
     * @return 博文 VO 或错误提示
     */
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public Result<PostVO> getPostById(@PathVariable Long id) {
        Post post = postService.getPostById(id);
        if (post != null) {
            return Result.success(PostConverter.toPostVO(post));
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "文章不存在");
        }
    }

    /**
     * 管理员多条件搜索博文
     * <p>
     *
     * @param title    博文标题
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文 VO 分页结果
     */
    @PostMapping("/title")
    @PreAuthorize("isAuthenticated()")
    public Result<PageResult<PostVO>> listPostsByTitle(
            @RequestParam String title,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<Post> page = postService.pagePostsByTitle(title, pageNum, pageSize);
        List<PostVO> rows = page.getRows().stream()
                .map(PostConverter::toPostVO)
                .toList();
        return Result.success(PageResult.of(rows, page.getTotal(),
                page.getPageNum(), page.getPageSize()));
    }

    /**
     * 管理员多条件搜索博文
     * <p>
     *
     * @param req      管理员博文搜索请求
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文 VO 分页结果
     */
    @PostMapping("/admin/query")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public Result<PageResult<PostVO>> queryPosts(
            @RequestBody PostSearchRequest req,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<Post> page = postService.queryPosts(req.getTitle(),
                req.getAuthor(), req.getTags(), req.getStatus(), pageNum, pageSize);
        List<PostVO> rows = page.getRows().stream()
                .map(PostConverter::toPostVO)
                .toList();
        return Result.success(PageResult.of(rows, page.getTotal(),
                page.getPageNum(), page.getPageSize()));
    }

    /**
     * 更新博文
     *
     * @param id      博文主键
     * @param request 更新参数
     * @return 更新后的博文实体或错误提示
     */
    @PutMapping("/{id}")
    @PreAuthorize("@postSecurityService.isOwner(#id) or hasAnyRole('ADMIN', 'MODERATOR')")
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
                .build();

        Post updatedPost = postService.updatePost(id, post);
        if (updatedPost != null) {
            return Result.success(updatedPost);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "更新失败，文章不存在");
        }
    }

    /**
     * 管理员修改博文状态
     *
     * @param id     博文主键
     * @param status 目标状态
     * @return 更新后的博文实体或错误提示
     */
    @PutMapping("/status/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public Result<Post> updatePostStatus(@PathVariable Long id, @RequestParam PostStatusEnum status) {
        Post post = Post.builder()
                .id(id)
                .status(status)
                .build();
        Post updated = postService.updatePost(id, post);
        if (updated != null) {
            return Result.success(updated);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "更新失败，文章不存在");
        }
    }

    /**
     * 删除博文（逻辑删除）
     *
     * @param id 博文主键
     * @return 是否删除成功
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@postSecurityService.isOwner(#id) or hasAnyRole('ADMIN', 'MODERATOR')")
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
     *
     * @param id 博文主键
     * @return 是否点赞成功
     */
    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
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
     * 取消点赞博文
     *
     * @param id 博文主键
     * @return 是否取消成功
     */
    @PostMapping("/{id}/unlike")
    @PreAuthorize("isAuthenticated()")
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
     * 查询当前用户对某条博文的点赞状态
     *
     * @param id 博文主键
     * @return true 已点赞；false 未点赞
     */
    @GetMapping("/{id}/like/status")
    @PreAuthorize("isAuthenticated()")
    public Result<Boolean> checkLikeStatus(@PathVariable Long id) {
        Long currentUserId = authService.getCurrentUserId();
        boolean liked = userPostLikeService.isLiked(currentUserId, id);
        return Result.success(liked);
    }
}
