package com.bryan.platform.domain.vo.post;

import com.bryan.platform.domain.enums.post.CommentStatusEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * CommentVO
 *
 * @author Bryan Long
 */
@Data
@Builder
public class CommentVO {

    private Long id;

    private Long postId;

    private Long rootId;

    private Long parentId;

    private Integer type;

    private String content;

    private Long replyToUserId;

    private String replyToUsername;

    private Integer floor;

    private Long likeCount;

    private Long dislikeCount;

    private Long childCount;

    private CommentStatusEnum status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Long userId;

    private String username;

    private String avatar;

    private List<CommentVO> replies;
}
