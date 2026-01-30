package com.bryan.platform.service.post;

import com.bryan.platform.domain.converter.PostConverter;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.enums.post.PostStatusEnum;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.vo.post.PostVO;
import com.bryan.platform.exception.BusinessException;
import com.bryan.platform.mapper.post.PostMapper;
import com.bryan.platform.service.user.UserFollowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;

/**
 * 博文业务服务
 * 提供博文的创建、删除、更新、分页查询、搜索、计数等能力。
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostMapper postMapper;
    private final UserFollowService userFollowService;

    /**
     * 创建博文（含草稿）
     * 自动注入 ID 与审计字段，事务提交后返回完整实体
     *
     * @param post 待保存博文实体
     * @return 已持久化的博文
     */
    @Transactional
    public Post createPost(Post post) {
        postMapper.insert(post);
        log.info("创建博文成功，帖子ID: {}", post.getId());
        return post;
    }

    /**
     * 保存博文并返回主键
     * 适用于只需主键的场景，减少一次查询
     *
     * @param post 待保存博文实体
     * @return 博文主键
     */
    public Long savePost(Post post) {
        postMapper.insert(post);
        log.info("保存博文草稿成功，帖子ID: {}", post.getId());
        return post.getId();
    }

    /**
     * 根据主键查询博文
     * 同时自动递增浏览数
     *
     * @param postId 博文主键
     * @return 博文实体；不存在返回 null
     */
    public Post getPostById(Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            log.warn("查询帖子不存在，ID: {}", postId);
            return null;
        }

        int increased = this.increaseViewCount(postId);
        if (increased <= 0) {
            throw new BusinessException("博文浏览数自增失败");
        }
        return post;
    }

    /**
     * 批量查询博文
     *
     * @param postIds 博文主键列表
     * @return 博文实体列表
     */
    public List<Post> getPostsByIds(List<Long> postIds) {
        List<Post> posts = postMapper.selectByIds(postIds);
        log.info("批量查询帖子完成，数量: {} , 请求IDs: {}", posts.size(), postIds);
        return posts;
    }

    /**
     * 分页查询指定用户的全部博文（含草稿、已删除）
     *
     * @param userId   用户主键
     * @param pageNum  当前页码（从 1 开始）
     * @param pageSize 每页条数
     * @return 博文分页结果
     */
    public PageResult<Post> pageUserPosts(Long userId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectByUserId(userId, offset, pageSize);
        long total = postMapper.countByUserId(userId);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 分页查询指定用户的博文审核视图（VO）
     *
     * @param userId   用户主键
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文 VO 分页结果
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
     * 分页查询指定用户已发布的博文
     *
     * @param userId   用户主键
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文分页结果
     */
    public PageResult<Post> pageUserPublishedPosts(Long userId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectByUserIdAndStatus(userId, PostStatusEnum.PUBLISHED, offset, pageSize);
        long total = postMapper.countByUserIdAndStatus(userId, PostStatusEnum.PUBLISHED);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 分页查询全局全部博文（含草稿、已删除）
     *
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文分页结果
     */
    public PageResult<Post> pageAllPosts(int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectPage(offset, pageSize);
        long total = postMapper.countAll();
        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 分页查询全站已发布博文
     *
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文分页结果
     */
    public PageResult<Post> pageAllPublishedPosts(int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectPageByStatus(PostStatusEnum.PUBLISHED, offset, pageSize);
        long total = postMapper.countByStatus(PostStatusEnum.PUBLISHED);
        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 分页查询当前用户关注用户的文章
     * 严格遵循架构原则：PostService 只调用 PostMapper，其他数据通过对应的 Service 获取
     *
     * @param followerId 关注者用户 ID
     * @param pageNum    当前页码
     * @param pageSize   每页条数
     * @return 博文分页结果
     */
    public PageResult<Post> pageFollowedUsersPosts(Long followerId, int pageNum, int pageSize) {
        // 1. 通过 UserFollowService 获取关注用户ID列表（遵循架构原则）
        List<Long> followingIds = userFollowService.getFollowingUserIds(followerId);

        if (followingIds.isEmpty()) {
            // 如果没有关注任何用户，返回空结果
            return PageResult.of(List.of(), 0L, pageNum, pageSize);
        }

        // 2. 通过 PostMapper 批量查询这些用户的已发布文章
        List<Post> allPosts = new ArrayList<>();
        for (Long userId : followingIds) {
            List<Post> userPosts = postMapper.selectByUserIdAndStatus(
                    userId, PostStatusEnum.PUBLISHED, 0, 50);
            allPosts.addAll(userPosts);
        }

        // 3. 按创建时间降序排序
        allPosts.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        // 4. 计算总数（注意：这里的总数不是准确的，因为限制了每用户的查询数量）
        long total = allPosts.size();

        // 5. 手动分页
        int startIndex = (pageNum - 1) * pageSize;
        int endIndex = Math.min(startIndex + pageSize, (int) total);
        List<Post> pagedPosts = startIndex < total ?
                allPosts.subList(startIndex, endIndex) : List.of();

        log.info("用户 {} 关注用户文章查询完成，关注 {} 人，共 {} 篇文章，当前页 {} 条",
                followerId, followingIds.size(), total, pagedPosts.size());

        return PageResult.of(pagedPosts, total, pageNum, pageSize);
    }

    /**
     * 多条件搜索博文
     *
     * @param title    标题关键词
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文分页结果
     */
    public PageResult<Post> pagePostsByTitle(String title, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectByTitle(title, PostStatusEnum.PUBLISHED, offset, pageSize);
        long total = postMapper.countByTitle(title, PostStatusEnum.PUBLISHED);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 多条件搜索博文（管理员）
     *
     * @param title    标题关键词（可空）
     * @param author   作者关键词（可空）
     * @param tags     标签关键词（可空）
     * @param status   状态枚举（可空）
     * @param pageNum  当前页码
     * @param pageSize 每页条数
     * @return 博文分页结果
     */
    public PageResult<Post> searchPosts(String title, String author, String tags, PostStatusEnum status, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<Post> rows = postMapper.selectBySearch(title, author, tags, status, offset, pageSize);
        long total = postMapper.countBySearch(title, author, tags, status);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 统计指定用户的博文数
     *
     * @param userId 用户主键
     * @return 博文数量
     */
    public long countUserPosts(Long userId) {
        long count = postMapper.countByUserId(userId);
        log.info("统计用户帖子数量，用户ID: {} , 结果: {}", userId, count);
        return count;
    }

    /**
     * 统计全局博文总数
     *
     * @return 博文数量
     */
    public long countAllPosts() {
        long count = postMapper.countAll();
        log.info("统计全局帖子数量，结果: {}", count);
        return count;
    }

    /**
     * 更新博文（全字段可选更新）
     * 仅对非 null 字段执行修改，事务控制
     *
     * @param id   博文主键
     * @param post 待更新字段封装实体
     * @return 更新后的博文；若不存在返回 null
     */
    @Transactional
    public Post updatePost(Long id, Post post) {
        Post existingPost = postMapper.selectById(id);
        if (existingPost == null) {
            log.warn("更新帖子失败，帖子不存在，ID: {}", id);
            return null;
        }

        // Update fields
        if (post.getUserId() != null) {
            existingPost.setUserId(post.getUserId());
        }
        if (post.getTitle() != null) {
            existingPost.setTitle(post.getTitle());
        }
        if (post.getContent() != null) {
            existingPost.setContent(post.getContent());
        }
        if (post.getStatus() != null) {
            existingPost.setStatus(post.getStatus());
        }
        if (post.getCategoryId() != null) {
            existingPost.setCategoryId(post.getCategoryId());
        }
        if (post.getTags() != null) {
            existingPost.setTags(post.getTags());
        }
        if (post.getCommentAreaStatus() != null) {
            existingPost.setCommentAreaStatus(post.getCommentAreaStatus());
        }
        if (post.getWeight() != null) {
            existingPost.setWeight(post.getWeight());
        }

        int rows = postMapper.update(existingPost);
        if (rows == 0) {
            log.warn("更新帖子失败，ID: {} , 可能已被修改或不存在", existingPost.getId());
            return null;
        }
        log.info("更新帖子成功，帖子ID: {}", existingPost.getId());
        return existingPost;
    }

    /**
     * 点赞数原子递增
     *
     * @param postId 博文主键
     * @return 影响行数
     */
    public int likePost(Long postId) {
        return postMapper.updateLikeCount(postId, 1);
    }

    /**
     * 点赞数原子递减
     *
     * @param postId 博文主键
     * @return 影响行数
     */
    public int unlikePost(Long postId) {
        return postMapper.updateLikeCount(postId, -1);
    }

    /**
     * 浏览数原子递增
     *
     * @param postId 博文主键
     * @return 影响行数
     */
    public int increaseViewCount(Long postId) {
        return postMapper.updateViewCount(postId, 1);
    }

    /**
     * 评论数原子更新
     *
     * @param postId 博文主键
     * @param delta  变化量（正/负）
     * @return 影响行数
     */
    public int updateCommentCount(Long postId, int delta) {
        return postMapper.updateCommentCount(postId, delta);
    }

    /**
     * 删除单篇博文（逻辑删除）
     *
     * @param postId 博文主键
     * @return 是否删除成功
     */
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

    /**
     * 批量删除博文（逻辑删除）
     *
     * @param postIds 博文主键列表
     */
    @Transactional
    public void deletePostBatch(List<Long> postIds) {
        for (Long id : postIds) {
            postMapper.deleteById(id);
            log.info("帖子ID: {} 删除成功 (逻辑删除)", id);
        }
        log.info("批量删除帖子完成，数量: {}", postIds.size());
    }

    /**
     * 查询最近发布的已发布帖子
     * 用于热度排行榜计算
     *
     * @param limit  返回数量限制
     * @param hours  时间范围（小时），只查询此时间范围内发布的帖子
     * @return 最近发布的帖子列表
     */
    public List<Post> findRecentPosts(int limit, int hours) {
        List<Post> posts = postMapper.selectRecentPosts(limit, hours);
        log.info("查询最近发布的帖子完成，数量: {}, 时间范围: {} 小时", posts.size(), hours);
        return posts;
    }
}
