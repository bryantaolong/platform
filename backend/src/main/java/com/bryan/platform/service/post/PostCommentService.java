package com.bryan.platform.service.post;

import com.bryan.platform.domain.converter.CommentConverter;
import com.bryan.platform.domain.entity.post.Post;
import com.bryan.platform.domain.entity.post.PostComment;
import com.bryan.platform.domain.enums.post.CommentStatusEnum;
import com.bryan.platform.domain.response.PageResult;
import com.bryan.platform.domain.vo.post.CommentVO;
import com.bryan.platform.exception.BusinessException;
import com.bryan.platform.mapper.post.PostCommentMapper;
import com.bryan.platform.mapper.post.PostMapper;
import com.bryan.platform.util.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 评论业务服务
 * 提供评论创建、删除、分页、树形查询及点赞等能力。
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostCommentService {

    private final PostCommentMapper postCommentMapper;
    private final PostMapper postMapper;

    /**
     * 创建评论（支持根评论与回复）
     *
     * @param userId        用户主键
     * @param postId        博文主键
     * @param parentId      父评论主键（根评论传 0 或 null）
     * @param replyToUserId 被回复人主键（可选）
     * @param content       评论内容
     * @return 已持久化的评论实体
     */
    @Transactional
    public PostComment createComment(Long userId, Long postId, Long parentId, Long replyToUserId, String content) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException("博文不存在");
        }

        PostComment comment = PostComment.builder()
                .userId(userId)
                .postId(postId)
                .parentId(parentId != null ? parentId : 0L)
                .rootId(0L)
                .replyToUserId(replyToUserId)
                .content(content)
                .likeCount(0L)
                .dislikeCount(0L)
                .childCount(0L)
                .status(CommentStatusEnum.NORMAL)
                .build();

        if (parentId == null || parentId == 0) {
            // 根评论
            comment.setType(1);
            int maxFloor = postCommentMapper.selectMaxFloorByPostId(postId);
            comment.setFloor(maxFloor + 1);
        } else {
            // 回复
            PostComment parentComment = postCommentMapper.selectById(parentId);
            if (parentComment == null) {
                throw new BusinessException("父评论不存在");
            }
            comment.setType(2);
            Long rootId = parentComment.getRootId();
            if (rootId == null || rootId == 0) {
                // 兼容历史数据：若父评论 rootId 为空且自身为根评论，则使用父评论 ID
                if (parentComment.getType() == 1) {
                    rootId = parentComment.getId();
                }
            }
            comment.setRootId(rootId);
            comment.setFloor(null);
            if (rootId != null && rootId > 0) {
                PostComment rootComment = postCommentMapper.selectById(rootId);
                postCommentMapper.increaseChildCount(rootId, rootComment);
            }
        }

        this.fillInsert(comment);
        postCommentMapper.insert(comment);

        // 若根评论 rootId 仍为空，则修正为自身 ID
        if (comment.getRootId() == null || comment.getRootId() == 0) {
            comment.setRootId(comment.getId());
            postCommentMapper.updateById(comment);
        }

        postMapper.updateCommentCount(postId, 1);

        log.info("创建评论成功，评论ID: {}, 博文ID: {}, 用户ID: {}", comment.getId(), postId, userId);
        return comment;
    }

    /**
     * 根据主键查询单条评论
     *
     * @param commentId 评论主键
     * @return 评论实体；不存在返回 null
     */
    public PostComment getCommentById(Long commentId) {
        return postCommentMapper.selectById(commentId);
    }

    /**
     * 查询指定博文的全部评论（平铺）
     *
     * @param postId 博文主键
     * @return 评论实体列表
     */
    public List<PostComment> listCommentsByPostId(Long postId) {
        return postCommentMapper.selectByPostId(postId);
    }

    /**
     * 分页查询指定博文的评论
     *
     * @param postId   博文主键
     * @param pageNum  当前页码（从 1 开始）
     * @param pageSize 每页条数
     * @return 分页结果
     */
    public PageResult<PostComment> pageCommentsByPostId(Long postId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<PostComment> rows = postCommentMapper.selectByPostIdWithPage(postId, offset, pageSize);
        long total = postCommentMapper.countByPostId(postId);
        return PageResult.of(rows, total, pageNum, pageSize);
    }

    /**
     * 查询某条评论的直接回复列表
     *
     * @param commentId 父评论主键
     * @return 回复列表
     */
    public List<PostComment> listRepliesByCommentId(Long commentId) {
        return postCommentMapper.selectByRootId(commentId);
    }

    /**
     * 查询热门评论（按点赞数倒序）
     *
     * @param postId 博文主键
     * @param limit  返回条数
     * @return 评论实体列表
     */
    public List<PostComment> listHotComments(Long postId, int limit) {
        return postCommentMapper.selectHotCommentsByPostId(postId, limit);
    }

    /**
     * 查询最新评论（按创建时间倒序）
     *
     * @param postId 博文主键
     * @param limit  返回条数
     * @return 评论实体列表
     */
    public List<PostComment> listLatestComments(Long postId, int limit) {
        return postCommentMapper.selectLatestCommentsByPostId(postId, limit);
    }

    /**
     * 统计指定博文的评论数
     *
     * @param postId 博文主键
     * @return 评论数量
     */
    public long countCommentsByPostId(Long postId) {
        return postCommentMapper.countByPostId(postId);
    }

    /**
     * 构建评论树（两层：根评论 + 回复）
     *
     * @param postId 博文主键
     * @return 树形评论 VO 列表
     */
    public List<CommentVO> getCommentTree(Long postId) {
        List<PostComment> allComments = postCommentMapper.selectByPostIdWithUser(postId);

        // 修复数据一致性（兼容历史脏数据）
        Map<Long, PostComment> commentMap = allComments.stream()
                .collect(Collectors.toMap(PostComment::getId, c -> c));

        // 1. 确保所有根评论 rootId 为自身
        for (PostComment comment : allComments) {
            if (comment.getType() == 1) {
                if (comment.getRootId() == null || comment.getRootId() == 0) {
                    comment.setRootId(comment.getId());
                }
            }
        }

        // 2. 确保所有回复的 rootId 正确指向根评论
        for (PostComment comment : allComments) {
            if (comment.getType() == 2 && (comment.getRootId() == null || comment.getRootId() == 0)) {
                PostComment current = comment;
                while (current.getType() == 2 && current.getParentId() != null) {
                    PostComment parent = commentMap.get(current.getParentId());
                    if (parent == null) break;
                    current = parent;
                }
                if (current.getType() == 1) {
                    comment.setRootId(current.getId());
                }
            }
        }

        Map<Long, List<PostComment>> repliesMap = allComments.stream()
                .filter(c -> c.getType() == 2)
                .collect(Collectors.groupingBy(PostComment::getRootId));

        List<PostComment> rootComments = allComments.stream()
                .filter(c -> c.getType() == 1)
                .collect(Collectors.toList());

        List<CommentVO> result = new ArrayList<>();
        for (PostComment root : rootComments) {
            CommentVO rootVO = CommentConverter.toCommentVO(root);
            rootVO.setUserId(root.getUserId());
            List<PostComment> replies = repliesMap.getOrDefault(root.getId(), new ArrayList<>());
            List<CommentVO> replyVOs = replies.stream()
                    .map(reply -> {
                        CommentVO replyVO = CommentConverter.toCommentVO(reply);
                        replyVO.setUserId(reply.getUserId());
                        return replyVO;
                    })
                    .collect(Collectors.toList());
            rootVO.setReplies(replyVOs);
            result.add(rootVO);
        }

        return result;
    }

    /**
     * 点赞评论
     *
     * @param commentId 评论主键
     * @return 影响行数
     */
    @Transactional
    public int likeComment(Long commentId) {
        PostComment comment = postCommentMapper.selectById(commentId);
        if (comment == null) {
            throw new BusinessException("评论不存在");
        }
        return postCommentMapper.increaseLikeCount(commentId, comment);
    }

    /**
     * 点踩评论
     *
     * @param commentId 评论主键
     * @return 影响行数
     */
    @Transactional
    public int dislikeComment(Long commentId) {
        PostComment comment = postCommentMapper.selectById(commentId);
        if (comment == null) {
            throw new BusinessException("评论不存在");
        }
        return postCommentMapper.increaseDislikeCount(commentId, comment);
    }

    /**
     * 删除评论（逻辑删除）
     *
     * @param commentId 评论主键
     * @return 是否删除成功
     */
    @Transactional
    public boolean deleteComment(Long commentId) {
        PostComment comment = postCommentMapper.selectById(commentId);
        if (comment == null) {
            log.warn("删除评论失败，评论不存在，ID: {}", commentId);
            return false;
        }

        int rows = postCommentMapper.deleteById(
                commentId,
                comment.getVersion(),
                LocalDateTime.now(),
                JwtUtils.getCurrentUsername()
        );
        if (rows > 0) {
            postMapper.updateCommentCount(comment.getPostId(), -1);
            log.info("评论ID: {} 删除成功 (逻辑删除)", commentId);
            return true;
        }
        log.warn("评论ID: {} 删除失败，可能已被其他用户修改", commentId);
        return false;
    }

    private void fillInsert(PostComment comment) {
        LocalDateTime now = LocalDateTime.now();
        Long operator = JwtUtils.getCurrentUserId();

        comment.setDeleted(0);
        comment.setVersion(0);
        comment.setCreatedAt(now);
        comment.setUpdatedAt(now);
        comment.setUpdatedBy(operator.toString());
        comment.setCreatedBy(operator.toString());
    }
}
