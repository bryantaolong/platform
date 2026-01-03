package com.bryan.platform.service.post;

import com.bryan.platform.domain.converter.PostConverter;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.enums.post.PostStatusEnum;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.vo.post.PostVO;
import com.bryan.platform.mapper.post.PostMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * PostService
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostMapper postMapper;

    /* ---------- 增 ---------- */
    @Transactional
    public Long savePost(Post post) {
        postMapper.insert(post);
        log.info("创建帖子成功，帖子ID: {}", post.getId());
        return post.getId();
    }

    /* ---------- 删 ---------- */
    @Transactional
    public Long deletePost(Long postId) {
        postMapper.deleteById(postId);
        log.info("帖子ID: {} 删除成功 (逻辑删除)", postId);
        return postId;
    }

    @Transactional
    public void deletePostBatch(List<Long> postIds) {
        for (Long id : postIds) {
            postMapper.deleteById(id);
            log.info("帖子ID: {} 删除成功 (逻辑删除)", id);
        }
        log.info("批量删除帖子完成，数量: {}", postIds.size());
    }

    /* ---------- 改 ---------- */
    @Transactional
    public void updatePost(Post post) {
        int rows = postMapper.update(post);
        if (rows == 0) {
            log.warn("更新帖子失败，ID: {} , 可能已被修改或不存在", post.getId());
            throw new RuntimeException("更新失败，数据已被修改或不存在");
        }
        log.info("更新帖子成功，帖子ID: {}", post.getId());
    }

    @Transactional
    public void updatePostStatus(Long postId, PostStatusEnum status) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            log.warn("更新帖子状态失败，帖子不存在，ID: {}", postId);
            throw new RuntimeException("帖子不存在");
        }
        post.setStatus(status);
        updatePost(post);
        log.info("更新帖子状态成功，帖子ID: {} , 新状态: {}", postId, status);
    }

    /* ---------- 单查 ---------- */
    public Post findPostById(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            log.warn("查询帖子不存在，ID: {}", postId);
        }
        return post;
    }

    public List<Post> findPostsByIds(List<Long> postIds) {
        List<Post> posts = postMapper.selectByIds(postIds);
        log.info("批量查询帖子完成，数量: {} , 请求IDs: {}", posts.size(), postIds);
        return posts;
    }

    /* ---------- 列表/分页 ---------- */
    /**
     * 分页查询某用户的帖子
     */
    public PageResult<Post> pageUserPosts(Long userId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectByUserId(userId, offset, pageSize);
        long total = postMapper.countByUserId(userId);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 分页查询全局帖子
     */
    public PageResult<Post> pageAllPosts(int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectPage(offset, pageSize);
        long total = postMapper.countAll();
        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /* ---------- 计数 ---------- */
    public long countUserPosts(Long userId) {
        long count = postMapper.countByUserId(userId);
        log.info("统计用户帖子数量，用户ID: {} , 结果: {}", userId, count);
        return count;
    }

    public long countAllPosts() {
        long count = postMapper.countAll();
        log.info("统计全局帖子数量，结果: {}", count);
        return count;
    }
}