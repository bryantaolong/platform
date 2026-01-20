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
 * PostCommentService
 *
 * @author Bryan Long
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostCommentService {

    private final PostCommentMapper postCommentMapper;
    private final PostMapper postMapper;

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
                .deleted(0)
                .version(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy(String.valueOf(userId))
                .updatedBy(String.valueOf(userId))
                .build();

        if (parentId == null || parentId == 0) {
            comment.setType(1);
            int maxFloor = postCommentMapper.selectMaxFloorByRootId(postId);
            comment.setFloor(maxFloor + 1);
        } else {
            PostComment parentComment = postCommentMapper.selectById(parentId);
            if (parentComment == null) {
                throw new BusinessException("父评论不存在");
            }
            comment.setType(2);
            Long rootId = parentComment.getRootId();
            if (rootId == null || rootId == 0) {
                // If parent is a root comment (type 1) but has invalid rootId (legacy bug), use its own ID
                if (parentComment.getType() == 1) {
                    rootId = parentComment.getId();
                }
            }
            comment.setRootId(rootId);
            comment.setFloor(null);
            if (rootId != null && rootId > 0) {
                postCommentMapper.increaseChildCount(rootId);
            }
        }

        postCommentMapper.insert(comment);

        if (comment.getRootId() == null || comment.getRootId() == 0) {
            comment.setRootId(comment.getId());
            postCommentMapper.updateById(comment);
        }

        postMapper.updateCommentCount(postId, 1);

        log.info("创建评论成功，评论ID: {}, 博文ID: {}, 用户ID: {}", comment.getId(), postId, userId);
        return comment;
    }

    @Transactional
    public boolean deleteComment(Long commentId) {
        PostComment comment = postCommentMapper.selectById(commentId);
        if (comment == null) {
            log.warn("删除评论失败，评论不存在，ID: {}", commentId);
            return false;
        }

        int rows = postCommentMapper.deleteById(commentId);
        if (rows > 0) {
            postMapper.updateCommentCount(comment.getPostId(), -1);
            log.info("评论ID: {} 删除成功 (逻辑删除)", commentId);
            return true;
        }
        return false;
    }

    public PostComment getCommentById(Long commentId) {
        return postCommentMapper.selectById(commentId);
    }

    public List<PostComment> getCommentsByPostId(Long postId) {
        return postCommentMapper.selectByPostId(postId);
    }

    public PageResult<PostComment> pageCommentsByPostId(Long postId, int pageNum, int pageSize) {
        int offset = (pageNum - 1) * pageSize;
        List<PostComment> rows = postCommentMapper.selectByPostIdWithPage(postId, offset, pageSize);
        long total = postCommentMapper.countByPostId(postId);

        return PageResult.of(rows, total, pageNum, pageSize);
    }

    public List<PostComment> getRepliesByCommentId(Long commentId) {
        return postCommentMapper.selectByRootId(commentId);
    }

    public List<PostComment> getHotComments(Long postId, int limit) {
        return postCommentMapper.selectHotCommentsByPostId(postId, limit);
    }

    public List<PostComment> getLatestComments(Long postId, int limit) {
        return postCommentMapper.selectLatestCommentsByPostId(postId, limit);
    }

    public long countCommentsByPostId(Long postId) {
        return postCommentMapper.countByPostId(postId);
    }

    @Transactional
    public int likeComment(Long commentId) {
        PostComment comment = postCommentMapper.selectById(commentId);
        if (comment == null) {
            throw new BusinessException("评论不存在");
        }
        return postCommentMapper.increaseLikeCount(commentId);
    }

    @Transactional
    public int dislikeComment(Long commentId) {
        PostComment comment = postCommentMapper.selectById(commentId);
        if (comment == null) {
            throw new BusinessException("评论不存在");
        }
        return postCommentMapper.increaseDislikeCount(commentId);
    }

    public List<CommentVO> getCommentTree(Long postId) {
        List<PostComment> allComments = postCommentMapper.selectByPostIdWithUser(postId);

        // Fix data consistency issues in memory (legacy data support)
        Map<Long, PostComment> commentMap = allComments.stream()
                .collect(Collectors.toMap(PostComment::getId, c -> c));

        // 1. Ensure all root comments have correct rootId (self)
        for (PostComment comment : allComments) {
            if (comment.getType() == 1) {
                if (comment.getRootId() == null || comment.getRootId() == 0) {
                    comment.setRootId(comment.getId());
                }
            }
        }

        // 2. Ensure all replies have correct rootId
        for (PostComment comment : allComments) {
            if (comment.getType() == 2 && (comment.getRootId() == null || comment.getRootId() == 0)) {
                PostComment current = comment;
                // Traverse up
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
}
