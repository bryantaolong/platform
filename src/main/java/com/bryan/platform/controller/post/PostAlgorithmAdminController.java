package com.bryan.platform.controller.post;

import com.bryan.platform.domain.entity.algorithm.PostHotRankAlgorithm;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.enums.HttpStatus;
import com.bryan.platform.domain.response.Result;
import com.bryan.platform.domain.vo.algorithm.PostHotRankAlgorithmVO;
import com.bryan.platform.service.algorithm.PostHotRankAlgorithmService;
import com.bryan.platform.service.post.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/**
 * PostAlgorithmAdminController
 * 博文算法管理控制器
 * 统一管理博文推荐算法相关的后台配置接口，包括算法权重配置和博文置顶管理
 *
 * @author Bryan Long
 */
@RestController
@RequestMapping("/api/admin/post-algorithm")
@RequiredArgsConstructor
public class PostAlgorithmAdminController {

    private final PostHotRankAlgorithmService postHotRankAlgorithmService;
    private final PostService postService;

    /**
     * ========== 算法权重配置相关接口 ==========
     */

    /**
     * 查询全部算法权重配置
     *
     * @return 权重配置列表
     */
    @GetMapping("/weights")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<PostHotRankAlgorithmVO>> listWeights() {
        List<PostHotRankAlgorithm> list = postHotRankAlgorithmService.listAll();
        List<PostHotRankAlgorithmVO> vos = list.stream()
                .map(a -> PostHotRankAlgorithmVO.builder()
                        .id(a.getId())
                        .metricKey(a.getMetricKey())
                        .metricValue(a.getMetricValue())
                        .description(a.getDescription())
                        .build())
                .toList();
        return Result.success(vos);
    }

    /**
     * 更新单个指标的权重值
     *
     * @param id          主键
     * @param metricValue 权重值
     * @return 更新后的配置
     */
    @PutMapping("/weights/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PostHotRankAlgorithmVO> updateWeight(
            @PathVariable Long id,
            @RequestParam BigDecimal metricValue) {
        PostHotRankAlgorithm updated = postHotRankAlgorithmService.updateWeight(id, metricValue);
        PostHotRankAlgorithmVO vo = PostHotRankAlgorithmVO.builder()
                .id(updated.getId())
                .metricKey(updated.getMetricKey())
                .metricValue(updated.getMetricValue())
                .description(updated.getDescription())
                .build();
        return Result.success(vo);
    }

    /**
     * ========== 博文置顶管理相关接口 ==========
     */

    /**
     * 管理员设置博文权重（用于人工置顶与排序干预）
     *
     * @param postId 博文主键
     * @param weight 权重值，数值越大优先级越高
     * @return 更新后的博文实体或错误提示
     */
    @PutMapping("/posts/{postId}/weight")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Post> updatePostWeight(
            @PathVariable("postId") Long postId,
            @RequestParam Integer weight) {
        Post post = Post.builder()
                .id(postId)
                .weight(weight)
                .build();
        Post updated = postService.updatePost(postId, post);
        if (updated != null) {
            return Result.success(updated);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "更新失败，文章不存在");
        }
    }

    /**
     * 管理员取消博文置顶
     * 将博文权重恢复为默认值 1，取消人工置顶状态
     *
     * @param postId 博文主键
     * @return 更新后的博文实体或错误提示
     */
    @PutMapping("/posts/{postId}/unpin")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Post> unpinPost(@PathVariable("postId") Long postId) {
        Post post = Post.builder()
                .id(postId)
                .weight(1)
                .build();
        Post updated = postService.updatePost(postId, post);
        if (updated != null) {
            return Result.success(updated);
        } else {
            return Result.error(HttpStatus.NOT_FOUND, "取消置顶失败，文章不存在");
        }
    }
}
