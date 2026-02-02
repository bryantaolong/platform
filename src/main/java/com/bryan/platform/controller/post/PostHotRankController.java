package com.bryan.platform.controller.post;

import com.bryan.platform.domain.response.Result;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.vo.post.PostVO;
import com.bryan.platform.service.algorithm.PostHotRankService;
import com.bryan.platform.service.post.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/**
 * PostHotRankController
 * 帖子热度排行榜控制器
 *
 * @author Bryan Long
 */
@Slf4j
@RestController
@RequestMapping("/api/posts/hot")
@RequiredArgsConstructor
public class PostHotRankController {

    private static final int DEFAULT_LIMIT = 10;
    private static final int DEFAULT_HOURS = 168;
    private static final int MAX_LIMIT = 100;

    private final PostHotRankService hotRankService;

    private final PostService postService;

    /**
     * 获取热门帖子排行榜
     *
     * @param limit 返回数量限制，默认10，最大100
     * @return 热门帖子列表
     */
    @GetMapping
    @PreAuthorize("permitAll()")
    public Result<List<PostVO>> listHotPosts(@RequestParam(defaultValue = "10") int limit) {
        int validLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
        List<Post> posts = postService.listRecentPosts(validLimit * 10, DEFAULT_HOURS);

        List<PostVO> hotPosts = posts.stream()
                .map(p -> {
                    PostVO vo = PostVO.builder()
                            .id(p.getId())
                            .userId(p.getUserId())
                            .title(p.getTitle())
                            .content(p.getContent())
                            .status(p.getStatus())
                            .categoryId(p.getCategoryId())
                            .tags(p.getTags())
                            .commentAreaStatus(p.getCommentAreaStatus())
                            .viewCount(p.getViewCount())
                            .likeCount(p.getLikeCount())
                            .commentCount(p.getCommentCount())
                            .collectCount(p.getCollectCount())
                            .shareCount(p.getShareCount())
                            .createdAt(p.getCreatedAt())
                            .updatedAt(p.getUpdatedAt())
                            .hotScore(hotRankService.calculateHotScore(p))
                            .build();
                    return vo;
                })
                .sorted(Comparator.comparingDouble(PostVO::getHotScore).reversed())
                .limit(validLimit)
                .toList();

        log.info("热门帖子查询完成，返回数量: {}", hotPosts.size());
        return Result.success(hotPosts);
    }
}
