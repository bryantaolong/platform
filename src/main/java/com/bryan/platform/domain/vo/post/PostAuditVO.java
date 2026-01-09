package com.bryan.platform.domain.vo.post;

import com.bryan.platform.domain.enums.post.CommentAreaStatusEnum;
import com.bryan.platform.domain.enums.post.PostStatusEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * PostAuditVO
 *
 * @author Bryan Long
 */
@Data
@Builder
public class PostAuditVO {

    private Long id;

    private Long userId;

    private String author;

    private String title;

    private String content;

    private PostStatusEnum status;

    private Long categoryId;

    private List<String> tags;

    private CommentAreaStatusEnum commentAreaStatus;

    // count numbers
    private Long viewCount;

    private Long likeCount;

    private Long commentCount;

    private Long collectCount;

    private Long shareCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

