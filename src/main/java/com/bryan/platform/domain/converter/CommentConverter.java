package com.bryan.platform.domain.converter;

import com.bryan.platform.domain.entity.post.PostComment;
import com.bryan.platform.domain.vo.post.CommentVO;

/**
 * CommentConverter
 *
 * @author Bryan Long
 */
public class CommentConverter {

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
