package com.bryan.platform.controller.post;

import com.bryan.platform.domain.converter.PostConverter;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.response.Result;
import com.bryan.platform.domain.vo.post.PostVO;
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

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<Post>> getAllPosts(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        // 1. 调用服务层获取所有用户列表
        return Result.success(postService.pageAllPosts(pageNum, pageSize));
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
}
