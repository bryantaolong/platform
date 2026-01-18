package com.bryan.platform.service.post;

import com.bryan.platform.domain.converter.PostConverter;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.enums.post.PostStatusEnum;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.vo.post.PostVO;
import com.bryan.platform.exception.BusinessException;
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
    public Post createPost(Post post) {
        postMapper.insert(post);
        log.info("创建帖子成功，帖子ID: {}", post.getId());
        return post;
    }

    public Long savePost(Post post) {
        postMapper.insert(post);
        log.info("创建帖子成功，帖子ID: {}", post.getId());
        return post.getId();
    }

    /* ---------- 删 ---------- */
    @Transactional
    public boolean deletePost(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            log.warn("删除帖子失败，帖子不存在，ID: {}", postId);
            return false;
        }
        postMapper.deleteById(postId);
        log.info("帖子ID: {} 删除成功 (逻辑删除)", postId);
        return true;
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
    public Post updatePost(Long id, Post post) {
        Post existingPost = postMapper.selectById(id);
        if (existingPost == null) {
            log.warn("更新帖子失败，帖子不存在，ID: {}", id);
            return null;
        }

        // Update fields
        existingPost.setUserId(post.getUserId());
        existingPost.setTitle(post.getTitle());
        existingPost.setContent(post.getContent());
        existingPost.setStatus(post.getStatus());
        existingPost.setCategoryId(post.getCategoryId());
        existingPost.setTags(post.getTags());
        existingPost.setCommentAreaStatus(post.getCommentAreaStatus());

        int rows = postMapper.update(existingPost);
        if (rows == 0) {
            log.warn("更新帖子失败，ID: {} , 可能已被修改或不存在", existingPost.getId());
            return null;
        }
        log.info("更新帖子成功，帖子ID: {}", existingPost.getId());
        return existingPost;
    }

    @Transactional
    public void updatePostStatus(Long postId, PostStatusEnum status) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            log.warn("更新帖子状态失败，帖子不存在，ID: {}", postId);
            throw new RuntimeException("帖子不存在");
        }
        post.setStatus(status);
        int rows = postMapper.update(post);
        if (rows == 0) {
            log.warn("更新帖子状态失败，ID: {} , 可能已被修改或不存在", post.getId());
            throw new RuntimeException("更新失败，数据已被修改或不存在");
        }
        log.info("更新帖子状态成功，帖子ID: {} , 新状态: {}", postId, status);
    }

    public int likePost(Long postId) {
        return postMapper.updateLikeCount(postId, 1);
    }

    public int unlikePost(Long postId) {
        return postMapper.updateLikeCount(postId, -1);
    }

    public int increaseViewCount(Long postId) {
        return postMapper.updateViewCount(postId, 1);
    }

    /* ---------- 单查 ---------- */
    public Post getPostById(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            log.warn("查询帖子不存在，ID: {}", postId);
        }

        int increased = this.increaseViewCount(postId);
        if (increased <= 0) {
            throw new BusinessException("博文浏览数自增失败");
        }
        return post;
    }

    public List<Post> getPostsByIds(List<Long> postIds) {
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
     * 分页查询某用户的帖子
     */
    public PageResult<PostVO> pageUserPostAuditVos(Long userId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectByUserId(userId, offset, pageSize);
        long total = postMapper.countByUserId(userId);

        List<PostVO> auditVos = rows.stream()
                .map(PostConverter::toPostVO)
                .toList();

        return PageResult.of(auditVos, total, pageNum, pageSize);
    }

    /**
     * 分页查询某用户已发布的帖子
     */
    public PageResult<Post> pageUserPublishedPosts(Long userId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectByUserIdAndStatus(userId, PostStatusEnum.PUBLISHED, offset, pageSize);
        long total = postMapper.countByUserIdAndStatus(userId, PostStatusEnum.PUBLISHED);

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

    /**
     * 分页查询全站已发布帖子
     */
    public PageResult<Post> pageAllPublishedPosts(int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectPageByStatus(PostStatusEnum.PUBLISHED, offset, pageSize);
        long total = postMapper.countByStatus(PostStatusEnum.PUBLISHED);
        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 分页搜索帖子
     */
    public PageResult<Post> searchPosts(String title, String author, String tags, PostStatusEnum status, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectBySearch(title, author, tags, status, offset, pageSize);
        long total = postMapper.countBySearch(title, author, tags, status);

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