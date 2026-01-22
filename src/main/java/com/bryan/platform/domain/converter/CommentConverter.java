package com.bryan.platform.domain.converter;

import com.bryan.platform.domain.entity.post.PostComment;
import com.bryan.platform.domain.vo.post.CommentVO;

/**
 * 评论实体与值对象转换器
 * 负责 PostComment 与 CommentVO 之间的单向转换（entity → vo）。
 *
 * @author Bryan Long
 */
public class CommentConverter {

    /**
     * 将评论实体转换为对外展示的 VO
     *
     * @param comment 评论实体
     * @return 评论 VO；若入参为 null 则返回 null
     */
    public static CommentVO toCommentVO(PostComment comment) {
        if (comment == null) {
            return null;
        }

        return CommentVO.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .rootId(comment.getRootId())
                .parentId(comment.getParentId())
                .type(comment.getType())
                .content(comment.getContent())
                .replyToUserId(comment.getReplyToUserId())
                .replyToUsername(comment.getReplyToUsername())
                .floor(comment.getFloor())
                .likeCount(comment.getLikeCount())
                .dislikeCount(comment.getDislikeCount())
                .childCount(comment.getChildCount())
                .status(comment.getStatus())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .userId(comment.getUserId())
                .username(comment.getUsername())
                .avatar(comment.getAvatar())
                .build();
    }
}