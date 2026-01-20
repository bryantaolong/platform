package com.bryan.platform.domain.request.post;

import lombok.Getter;

/**
 * CommentCreateRequest
 *
 * @author Bryan Long
 */
@Getter
public class CommentCreateRequest {

    private Long postId;

    private Long parentId;

    private Long replyToUserId;

    private String content;
}
